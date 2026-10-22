import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/3D-Car-Design/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@dimforge')) return 'physics';
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true,
    open: false
  }
})
