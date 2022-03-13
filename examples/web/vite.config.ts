import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
  },
  resolve: {
    alias: {
      path: 'rollup-plugin-node-polyfills/polyfills/path',
      events: 'rollup-plugin-node-polyfills/polyfills/events',
    },
  },
})
