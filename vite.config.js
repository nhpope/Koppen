import { defineConfig } from 'vite';

export default defineConfig({
  base: '/koppen/',
  build: {
    outDir: 'dist',
    sourcemap: false, // Disabled for production security (prevent source code exposure)
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
