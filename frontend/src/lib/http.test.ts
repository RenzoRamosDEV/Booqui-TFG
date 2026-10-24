import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { ApiError } from './api-error'
import { createHttpClient } from './http'

type Reply = { status: number; data?: unknown } | 'network-error'

function fakeAdapter(reply: Reply = { status: 200, data: [] }) {
  const requests: InternalAxiosRequestConfig[] = []
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config)
    if (reply === 'network-error') throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    const response = { status: reply.status, statusText: '', data: reply.data, headers: {}, config }
    if (config.validateStatus?.(reply.status) ?? true) return response
    throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, response)
  }
  return { adapter, requests }
}

function fullUrl(config: InternalAxiosRequestConfig) {
  return `${config.baseURL ?? ''}${config.url ?? ''}`
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createHttpClient', () => {
  it.each([
    ['', '/api/v1/events'],
    ['https://api.example.test', 'https://api.example.test/api/v1/events'],
  ])('with VITE_API_BASE_URL=%j requests %s', async (base, expected) => {
    vi.stubEnv('VITE_API_BASE_URL', base)
    const { adapter, requests } = fakeAdapter()

    await createHttpClient({ adapter }).get('/api/v1/events')

    expect(fullUrl(requests[0]!)).toBe(expected)
  })

  it('uses a same-origin relative URL when VITE_API_BASE_URL is undefined', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined)
    const { adapter, requests } = fakeAdapter()

    await createHttpClient({ adapter }).get('/api/v1/events')

    expect(fullUrl(requests[0]!)).toBe('/api/v1/events')
  })

  it('lets callers pass an explicit base URL', async () => {
    const { adapter, requests } = fakeAdapter()

    await createHttpClient({ adapter, baseURL: 'http://x.test' }).get('/api/v1/users')

    expect(fullUrl(requests[0]!)).toBe('http://x.test/api/v1/users')
  })

  it('sends JSON without credentials or an Authorization header', async () => {
    localStorage.setItem('booqi-session', JSON.stringify({ state: { user: { id: 1 } } }))
    const { adapter, requests } = fakeAdapter()

    await createHttpClient({ adapter }).post('/api/v1/bookings', { eventId: 1 })

    const config = requests[0]!
    expect(config.headers.get('Authorization')).toBeUndefined()
    expect(config.headers.get('Content-Type')).toBe('application/json')
    expect(config.headers.get('Accept')).toBe('application/json')
    expect(config.withCredentials).toBeFalsy()
    expect(config.data).toBe('{"eventId":1}')
    localStorage.clear()
  })

  it('returns the response data on success', async () => {
    const { adapter } = fakeAdapter({ status: 200, data: [{ id: 1 }] })

    const response = await createHttpClient({ adapter }).get('/api/v1/events')

    expect(response.data).toEqual([{ id: 1 }])
  })

  it('rejects a ProblemDetail response as ApiError', async () => {
    const { adapter } = fakeAdapter({
      status: 404,
      data: { title: 'Not Found', status: 404, detail: 'Event with id 999 not found' },
    })

    const failure = createHttpClient({ adapter }).get('/api/v1/events/999')

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({
      status: 404,
      title: 'Not Found',
      detail: 'Event with id 999 not found',
    })
  })

  it('rejects a network failure as ApiError with status 0', async () => {
    const { adapter } = fakeAdapter('network-error')

    await expect(createHttpClient({ adapter }).get('/api/v1/events')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
    })
  })

  it('does not retry a 401', async () => {
    const { adapter, requests } = fakeAdapter({ status: 401, data: {} })

    await expect(createHttpClient({ adapter }).get('/api/v1/users/1')).rejects.toMatchObject({
      status: 401,
    })
    expect(requests).toHaveLength(1)
  })
})
