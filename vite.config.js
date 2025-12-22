import { defineConfig } from 'vite';

export default defineConfig({
  base: '/koppen/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
});
