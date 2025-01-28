import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 2000,
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3001,
  },
});
