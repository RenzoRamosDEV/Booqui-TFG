import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Strings that only exist in the demo modules: if any reaches dist/, the demo was not dead-code eliminated.
const DEMO_MARKERS = [
  'booqi-demo-state',
  'cliente@booqi.demo',
  'Demo · datos simulados',
  'Entrar como',
  'Noche de jazz en el Café Central',
  'demo.invalid',
]

test('the production build carries no demo code', () => {
  const files = readdirSync('dist', { recursive: true })
    .map(String)
    .filter((file) => /\.(js|html|css)$/.test(file))
  expect(files.length).toBeGreaterThan(0)
  const leaks = files.flatMap((file) => {
    const source = readFileSync(join('dist', file), 'utf8')
    return DEMO_MARKERS.filter((marker) => source.includes(marker)).map((m) => `${file}: ${m}`)
  })
  expect(leaks).toEqual([])
})

test('the production build keeps absolute asset paths for nginx', () => {
  const html = readFileSync('dist/index.html', 'utf8')
  expect(html).toMatch(/src="\/assets\/index-[\w-]+\.js"/)
})
