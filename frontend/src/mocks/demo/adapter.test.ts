import { AxiosError, AxiosHeaders } from 'axios'
import { ApiError } from '../../lib/api-error'
import { createHttpClient } from '../../lib/http'
import type { MockState } from '../mock-backend'
import { createDemoAdapter } from './adapter'
import { createDemoState, DEMO_ACCOUNTS } from './seed'

const NOW = new Date(2026, 9, 24, 12, 0, 0)

function client(state: MockState = createDemoState(NOW), options = {}) {
  return createHttpClient({ adapter: createDemoAdapter(state, options) })
}

describe('createDemoAdapter', () => {
  it('answers a GET from the in-memory state', async () => {
    const state = createDemoState(NOW)
    const response = await client(state).get('/api/v1/events')
    expect(response.status).toBe(200)
    expect(response.data).toEqual(state.events)
  })

  it('passes query params to the backend', async () => {
    const response = await client().get('/api/v1/bookings', { params: { userId: 3 } })
    expect(response.data.map((booking: { userId: number }) => booking.userId)).toEqual([3, 3])
  })

  it('sends the JSON body to the backend', async () => {
    const [account] = DEMO_ACCOUNTS
    const response = await client().post('/api/v1/users/login', {
      contactEmail: account.email,
      password: account.password,
    })
    expect(response.data).toMatchObject({ contactEmail: account.email })
  })

  it('uses only the path of an absolute URL', async () => {
    const response = await client().get('https://api.example.test/api/v1/events/101')
    expect(response.data).toMatchObject({ id: 101 })
  })

  it('resolves a 204 without data', async () => {
    const state = createDemoState(NOW)
    const response = await client(state).delete('/api/v1/events/101')
    expect(response.status).toBe(204)
    expect(response.data).toBeUndefined()
    expect(state.events.some((event) => event.id === 101)).toBe(false)
  })

  it('rejects an error status as the ApiError the real API would produce', async () => {
    const error = await client()
      .post('/api/v1/users/login', { contactEmail: 'x@y.z', password: 'nope' })
      .catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 401,
      title: 'Unauthorized',
      detail: 'Invalid email or password',
    })
  })

  it('rejects a 400, the lowest error status', async () => {
    const error = await client()
      .get('/api/v1/users/abc')
      .catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400 })
  })

  it('raises the same AxiosError message axios itself uses', async () => {
    const adapter = createDemoAdapter(createDemoState(NOW))
    const config = { method: 'get', url: '/api/v1/events/9', headers: new AxiosHeaders() }
    const error = await adapter(config).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(AxiosError)
    expect((error as AxiosError).message).toBe('Request failed with status code 404')
    await expect(adapter({ ...config, url: '/api/v1/events' })).resolves.toMatchObject({
      status: 200,
      statusText: '200',
    })
  })

  it('reports the state after every request so it can be saved', async () => {
    const state = createDemoState(NOW)
    const onChange = vi.fn()
    await client(state, { onChange }).get('/api/v1/events')
    expect(onChange).toHaveBeenCalledExactlyOnceWith(state)
  })

  it('reports the state after a failed request too', async () => {
    const onChange = vi.fn()
    await client(createDemoState(NOW), { onChange })
      .get('/api/v1/events/9')
      .catch(() => undefined)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('waits the configured latency before answering', async () => {
    vi.useFakeTimers()
    try {
      let settled = false
      const pending = client(createDemoState(NOW), { delayMs: 300 })
        .get('/api/v1/events')
        .then(() => {
          settled = true
        })
      await vi.advanceTimersByTimeAsync(299)
      expect(settled).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      await pending
      expect(settled).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
