import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import uniPluginModule from '@dcloudio/vite-plugin-uni';

const uni = (uniPluginModule as unknown as { default: typeof uniPluginModule }).default;

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@miniapp-model': fileURLToPath(new URL('./src/', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:3200', changeOrigin: true }
    }
  }
});
