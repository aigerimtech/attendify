import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-webcam'],
  },
  server: {
    host: true,
    port: 5174,
  },
})
