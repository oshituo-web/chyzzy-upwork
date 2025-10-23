import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Explicitly set the base for deployment on Vercel/GitHub Pages
  base: './', 
  build: {
    // This tells Vercel to look in the current directory for the assets
    outDir: 'dist',
  }
})
