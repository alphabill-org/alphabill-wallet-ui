import { defineConfig } from "vite";
import fs from 'fs';
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [eslint(), react(), viteTsconfigPaths(), svgrPlugin()],
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000
  },
  define: {
    global: "globalThis",
  },
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  preview: {
//    port: 3001,
    port: 443,
    https: {
      key: fs.readFileSync('/etc/letsencrypt/live/blocky.dyndns.org/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/blocky.dyndns.org/cert.pem'),
    }
  },
  resolve: {
    alias: {
      events: "events",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      "util/": "util",
      path: "path-browserify",
      crypto: "crypto-browserify",
      assert: "assert",
      http: "stream-http",
      https: "https-browserify",
      os: "os-browserify",
      url: "url",
    },
  }
});
