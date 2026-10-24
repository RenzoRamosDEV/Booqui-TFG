import { fileURLToPath } from 'node:url'
import { BASE, createLandingServer, demoMounts } from './landing-server.mjs'

const root = fileURLToPath(new URL('../../landing/', import.meta.url))
const mounts = demoMounts(fileURLToPath(new URL('../dist-demo/', import.meta.url)))
const port = Number(process.env.LANDING_PORT ?? 4190)

createLandingServer(root, mounts).listen(port, () => {
  console.log(`Landing at http://localhost:${port}${BASE}/`)
  console.log(
    mounts['demo/']
      ? `Demo at http://localhost:${port}${BASE}/demo/`
      : 'No demo: run "npm run build:demo" to serve it under demo/',
  )
})
