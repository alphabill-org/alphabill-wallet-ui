import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000
  },
  define: {
    global: "globalThis",
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 3001,
  }
});
