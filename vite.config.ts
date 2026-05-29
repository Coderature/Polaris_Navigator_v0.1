import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/yahoo-chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yahoo-chart/, ''),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      },
    },
  },
  build: { sourcemap: true },
});
