import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { http } from '../lib/http'

export type FakeReply = { status: number; data?: unknown } | 'network-error'

export type RecordedRequest = {
  method: string
  path: string
  query: string
  url: string
  body: unknown
}

type Handler = (request: RecordedRequest) => FakeReply | Promise<FakeReply>

type Route = { method: string; path: string | RegExp; handler: Handler }

function queryOf(config: InternalAxiosRequestConfig): string {
  const params = (config.params ?? {}) as Record<string, string | number>
  const entries = Object.entries(params).map(([key, value]) => [key, String(value)])
  return new URLSearchParams(entries).toString()
}

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  if (typeof config.data !== 'string' || config.data === '') return undefined
  return JSON.parse(config.data)
}

function matches(route: Route, request: RecordedRequest) {
  if (route.method !== request.method) return false
  return typeof route.path === 'string'
    ? route.path === request.path
    : route.path.test(request.path)
}

/** In-memory backend for the shared `http` instance; unmatched requests answer 501. */
export function createFakeApi() {
  const routes: Route[] = []
  const requests: RecordedRequest[] = []

  const adapter: AxiosAdapter = async (config) => {
    const path = config.url ?? ''
    const query = queryOf(config)
    const request: RecordedRequest = {
      method: (config.method ?? 'get').toUpperCase(),
      path,
      query,
      url: query ? `${path}?${query}` : path,
      body: bodyOf(config),
    }
    requests.push(request)
    const route = [...routes].reverse().find((candidate) => matches(candidate, request))
    const reply: FakeReply = route
      ? await route.handler(request)
      : { status: 501, data: { detail: `No fake route for ${request.method} ${request.url}` } }
    if (reply === 'network-error') throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    const response = { status: reply.status, statusText: '', data: reply.data, headers: {}, config }
    if (config.validateStatus?.(reply.status) ?? true) return response
    throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, response)
  }

  function on(method: string, path: string | RegExp, reply: FakeReply | Handler) {
    routes.push({ method, path, handler: typeof reply === 'function' ? reply : () => reply })
  }

  return {
    adapter,
    requests,
    on,
    get: (path: string | RegExp, reply: FakeReply | Handler) => on('GET', path, reply),
    post: (path: string | RegExp, reply: FakeReply | Handler) => on('POST', path, reply),
    put: (path: string | RegExp, reply: FakeReply | Handler) => on('PUT', path, reply),
    patch: (path: string | RegExp, reply: FakeReply | Handler) => on('PATCH', path, reply),
    delete: (path: string | RegExp, reply: FakeReply | Handler) => on('DELETE', path, reply),
    requestsTo: (method: string, path: string) =>
      requests.filter((request) => request.method === method && request.path === path),
  }
}

export type FakeApi = ReturnType<typeof createFakeApi>

/** Points the shared `http` client at a fresh fake for the current test and restores it afterwards. */
export function installFakeApi(): FakeApi {
  const api = createFakeApi()
  const previous = http.defaults.adapter
  http.defaults.adapter = api.adapter
  onTestFinished(() => {
    http.defaults.adapter = previous
  })
  return api
}
