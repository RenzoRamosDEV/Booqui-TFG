import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No changeOrigin: the forwarded Host must match the browser Origin so the services see same-origin requests.
const apiProxy = {
  '/api/v1/users': 'http://localhost:8080',
  '/api/v1/events': 'http://localhost:8081',
  '/api/v1/bookings': 'http://localhost:8082',
  '/api/v1/payments': 'http://localhost:8083',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: apiProxy,
  },
})
