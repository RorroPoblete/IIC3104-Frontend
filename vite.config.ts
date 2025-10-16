import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/public': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})
