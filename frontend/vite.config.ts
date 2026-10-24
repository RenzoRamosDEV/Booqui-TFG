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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: apiProxy,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    testTimeout: 5000,
  },
})
