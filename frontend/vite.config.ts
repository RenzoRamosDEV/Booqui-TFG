import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// No changeOrigin: the forwarded Host must match the browser Origin so the services see same-origin requests.
const apiProxy = {
  '/api/v1/users': 'http://localhost:8080',
  '/api/v1/events': 'http://localhost:8081',
  '/api/v1/bookings': 'http://localhost:8082',
  '/api/v1/payments': 'http://localhost:8083',
}

// Long-lived vendor chunks for the code every route needs; libraries reached only through dynamic
// import() (PDF, QR) are deliberately left out so they stay in their own on-demand chunks.
const vendorGroups = [
  { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
  { name: 'router', test: /[\\/]node_modules[\\/](react-router|cookie|set-cookie-parser)[\\/]/ },
  {
    name: 'motion',
    test: /[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/,
  },
  {
    name: 'vendor',
    test: /[\\/]node_modules[\\/](@tanstack|axios|zod|zustand|lucide-react)[\\/]/,
  },
]

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: { codeSplitting: { groups: vendorGroups } },
    },
  },
  server: {
    proxy: apiProxy,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    css: { include: [/tokens\.css/] },
    // Screen tests type into real forms; on a loaded machine a few seconds per test is normal.
    testTimeout: 15000,
  },
})
