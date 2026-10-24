// Fails when any emitted JavaScript chunk exceeds the size Vite warns about (500 kB, minified).
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const LIMIT_BYTES = 500 * 1000
const assetsDir = new URL('../dist/assets/', import.meta.url).pathname

let files
try {
  files = readdirSync(assetsDir).filter((name) => name.endsWith('.js'))
} catch {
  console.error(`No build found in ${assetsDir}. Run "npm run build" first.`)
  process.exit(1)
}

const chunks = files
  .map((name) => ({ name, bytes: statSync(join(assetsDir, name)).size }))
  .sort((a, b) => b.bytes - a.bytes)

for (const { name, bytes } of chunks) {
  const flag = bytes > LIMIT_BYTES ? '  <-- over 500 kB' : ''
  console.log(`${(bytes / 1000).toFixed(1).padStart(9)} kB  ${name}${flag}`)
}

const oversized = chunks.filter((chunk) => chunk.bytes > LIMIT_BYTES)
if (oversized.length > 0) {
  console.error(`\n${oversized.length} chunk(s) over 500 kB.`)
  process.exit(1)
}
console.log(`\n${chunks.length} chunks, all within 500 kB.`)
