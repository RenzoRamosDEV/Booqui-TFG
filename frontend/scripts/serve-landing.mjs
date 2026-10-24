import { fileURLToPath } from 'node:url'
import { BASE, createLandingServer } from './landing-server.mjs'

const root = fileURLToPath(new URL('../../landing/', import.meta.url))
const port = Number(process.env.LANDING_PORT ?? 4190)

createLandingServer(root).listen(port, () => {
  console.log(`Landing at http://localhost:${port}${BASE}/`)
})
