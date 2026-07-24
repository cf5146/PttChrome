import { Agent } from 'node:https';
import * as tls from 'node:tls';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const buildSha = process.env.GITHUB_SHA || 'local';
  const buildDate = process.env.BUILD_DATE || new Date().toISOString();
  const developmentProxyAgent = new Agent({
    ca: [
      ...tls.rootCertificates,
      ...(tls.getCACertificates?.('system') || [])
    ]
  });

  return {
    define: {
      __PTTCHROME_BUILD_SHA__: JSON.stringify(buildSha),
      __PTTCHROME_BUILD_DATE__: JSON.stringify(buildDate),
    },
    plugins: [
      {
        name: 'pttchrome-jsx-in-js',
        enforce: 'pre',
        async transform(code, id) {
          if (!/src\/.*\.js$/.test(id)) {
            return null;
          }

          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          });
        },
      },
      react({
        include: /\.[jt]sx?$/,
      }),
    ],
    assetsInclude: ['**/*.bin'],
    base: './',
    envPrefix: [
      'VITE_',
      'ALLOW_SITE_IN_QUERY',
      'PTTCHROME_PAGE_TITLE',
    ],
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
    },
    server: {
      port: 8080,
      strictPort: true,
      proxy: {
        '/bbs': {
          agent: developmentProxyAgent,
          target: 'https://ptt-proxy.cf5146.workers.dev',
          secure: true,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});