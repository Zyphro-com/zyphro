import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  define: {
    global: 'window',
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // El puerto donde correrá tu servidor de Node
        changeOrigin: true,
        secure: false,
      },
    },
  },
})