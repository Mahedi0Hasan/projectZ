import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Fixed file names, so the Shopify theme can reference assets/lucid.js and assets/lucid.css.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/lucid.js',
        chunkFileNames: 'assets/lucid-[name].js',
        assetFileNames: 'assets/lucid[extname]',
      },
    },
  },
})
