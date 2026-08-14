import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      // Create an alias to easily access client images
      '@images': path.resolve(__dirname, '../client/data/images'),
    },
  },
});
