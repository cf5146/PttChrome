import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const websocketProxyOrigin =
    env.PTTCHROME_PROXY_ORIGIN || 'https://cf5146.github.io';

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
    envPrefix: ['VITE_', 'ALLOW_SITE_IN_QUERY', 'PTTCHROME_PAGE_TITLE'],
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
          target: 'https://ws.ptt.cc',
          secure: true,
          ws: true,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReqWs', proxyReq => {
              proxyReq.setHeader('origin', websocketProxyOrigin);
            });
          },
        },
      },
    },
  };
});