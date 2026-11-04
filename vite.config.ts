import { defineConfig } from 'vite';

// base relativa para funcionar no itch.io e em qualquer subpasta
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
