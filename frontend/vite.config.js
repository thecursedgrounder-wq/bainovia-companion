import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev we proxy /api to the local Fastify backend, so the browser only
// ever talks to same-origin (avoids CORS and lets the httpOnly cookie work).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
