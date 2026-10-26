import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BASE, createPagesServer } from './pages-server.mjs'

const root = fileURLToPath(new URL('../dist-demo/', import.meta.url))
const mounts = { 'demo/': fileURLToPath(new URL('../pages-site/demo/', import.meta.url)) }
const port = Number(process.env.PAGES_PORT ?? 4190)

if (!existsSync(`${root}index.html`)) {
  console.error('No demo build: run "npm run build:demo" first')
  process.exit(1)
}

createPagesServer(root, mounts).listen(port, () => {
  console.log(`Pages site at http://localhost:${port}${BASE}/`)
})
