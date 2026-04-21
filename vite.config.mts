import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
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
          target: 'https://ptt-proxy.cf5146.workers.dev',
          secure: true,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});