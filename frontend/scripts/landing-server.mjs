// Static server for ../landing under /Booqui-TFG/, matching the GitHub Pages layout, with no dependencies.
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

export const BASE = '/Booqui-TFG'

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

export function contentType(file) {
  return CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream'
}

function decode(pathname) {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return null
  }
}

export function routeRequest(pathname) {
  if (pathname === BASE) return { redirect: `${BASE}/` }
  if (!pathname.startsWith(`${BASE}/`)) return { notFound: true }

  const relative = decode(pathname.slice(BASE.length + 1))
  if (relative === null || /[\0\\]/.test(relative)) return { notFound: true }
  if (relative.split('/').some((segment) => segment === '..' || segment === '.')) {
    return { notFound: true }
  }
  return { file: relative === '' || relative.endsWith('/') ? `${relative}index.html` : relative }
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

export function createLandingServer(root) {
  return createServer(async (request, response) => {
    const route = routeRequest(new URL(request.url, 'http://localhost').pathname)
    if (route.redirect) {
      response.writeHead(301, { Location: route.redirect }).end()
      return
    }
    const path = route.file && join(root, route.file)
    if (!path || !(await isFile(path))) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
      return
    }
    response.writeHead(200, { 'Content-Type': contentType(path), 'Cache-Control': 'no-cache' })
    createReadStream(path).pipe(response)
  })
}
