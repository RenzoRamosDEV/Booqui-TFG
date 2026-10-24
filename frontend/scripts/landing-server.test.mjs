import { strict as assert } from 'node:assert'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before } from 'node:test'
import { test } from 'node:test'
import { contentType, createLandingServer, routeRequest } from './landing-server.mjs'

test('base path without trailing slash redirects to the slash form', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG'), { redirect: '/Booqui-TFG/' })
})

test('base path with trailing slash serves index.html', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/'), { file: 'index.html' })
})

test('nested directory serves its index.html', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/assets/'), { file: 'assets/index.html' })
})

test('file under the base path maps to the same relative file', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/css/landing.css'), { file: 'css/landing.css' })
})

test('percent-encoded names are decoded', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/a%20b.txt'), { file: 'a b.txt' })
})

for (const pathname of ['/', '/other', '/Booqui-TFGx', '/booqui-tfg/', '/x/Booqui-TFG/']) {
  test(`path outside the base (${pathname}) is not found`, () => {
    assert.deepEqual(routeRequest(pathname), { notFound: true })
  })
}

for (const pathname of [
  '/Booqui-TFG/../package.json',
  '/Booqui-TFG/%2e%2e/package.json',
  '/Booqui-TFG/css/../../package.json',
  '/Booqui-TFG/..%2fpackage.json',
  '/Booqui-TFG/..',
]) {
  test(`path traversal (${pathname}) is not found`, () => {
    assert.deepEqual(routeRequest(pathname), { notFound: true })
  })
}

test('inner dot segments that stay inside the base are rejected too', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/css/../index.html'), { notFound: true })
})

test('single-dot segments are rejected', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/./index.html'), { notFound: true })
})

test('malformed percent-encoding is not found', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/%E0%A4%A'), { notFound: true })
})

test('NUL byte is not found', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/index.html%00'), { notFound: true })
})

test('backslash is not found', () => {
  assert.deepEqual(routeRequest('/Booqui-TFG/..%5cpackage.json'), { notFound: true })
})

for (const [file, type] of [
  ['index.html', 'text/html; charset=utf-8'],
  ['css/landing.css', 'text/css; charset=utf-8'],
  ['js/landing.js', 'text/javascript; charset=utf-8'],
  ['assets/fonts/inter.woff2', 'font/woff2'],
  ['assets/screenshots/home-light-640.webp', 'image/webp'],
  ['assets/icon-32.png', 'image/png'],
  ['assets/logo.svg', 'image/svg+xml'],
  ['assets/fonts/LICENSE-inter.txt', 'text/plain; charset=utf-8'],
  ['assets/old.jpg', 'image/jpeg'],
  ['UPPER.HTML', 'text/html; charset=utf-8'],
  ['no-extension', 'application/octet-stream'],
  ['archive.zip', 'application/octet-stream'],
]) {
  test(`content type of ${file} is ${type}`, () => {
    assert.equal(contentType(file), type)
  })
}

test.describe('HTTP server over a temporary landing folder', () => {
  let root
  let server
  let origin

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'landing-'))
    writeFileSync(join(root, 'index.html'), '<h1>Booqi</h1>')
    mkdirSync(join(root, 'css'))
    writeFileSync(join(root, 'css/landing.css'), 'body{}')
    mkdirSync(join(root, 'empty'))
    server = createLandingServer(root)
    await new Promise((listening) => server.listen(0, listening))
    origin = `http://localhost:${server.address().port}`
  })

  after(() => {
    server.close()
    rmSync(root, { recursive: true, force: true })
  })

  const get = (path) => fetch(`${origin}${path}`, { redirect: 'manual' })

  test('serves index.html with its type and no-cache', async () => {
    const response = await get('/Booqui-TFG/')
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8')
    assert.equal(response.headers.get('cache-control'), 'no-cache')
    assert.equal(await response.text(), '<h1>Booqi</h1>')
  })

  test('serves a nested file and ignores the query string', async () => {
    const response = await get('/Booqui-TFG/css/landing.css?v=1')
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/css; charset=utf-8')
    assert.equal(await response.text(), 'body{}')
  })

  test('redirects the base path to its trailing-slash form', async () => {
    const response = await get('/Booqui-TFG')
    assert.equal(response.status, 301)
    assert.equal(response.headers.get('location'), '/Booqui-TFG/')
  })

  for (const path of [
    '/Booqui-TFG/missing.css',
    '/Booqui-TFG/empty/',
    '/Booqui-TFG/css',
    '/other',
  ]) {
    test(`answers 404 in plain text for ${path}`, async () => {
      const response = await get(path)
      assert.equal(response.status, 404)
      assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8')
      assert.equal(await response.text(), 'Not found')
    })
  }
})
