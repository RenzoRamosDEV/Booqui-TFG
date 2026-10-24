import { ApiError } from './api-error'
import { createQueryClient, shouldRetry } from './query-client'

function apiError(status: number) {
  return new ApiError({ status, title: '', detail: '' })
}

describe('shouldRetry', () => {
  it.each([400, 401, 404, 409, 422, 499, -1])('does not retry status %i', (status) => {
    expect(shouldRetry(0, apiError(status))).toBe(false)
  })

  it.each([0, 500, 503])('retries the first failure with status %i', (status) => {
    expect(shouldRetry(0, apiError(status))).toBe(true)
  })

  it.each([0, 503])('does not retry status %i a second time', (status) => {
    expect(shouldRetry(1, apiError(status))).toBe(false)
  })

  it('does not retry errors that are not ApiError', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(false)
  })
})

describe('createQueryClient', () => {
  it('configures reads, writes and focus refetching', () => {
    const defaults = createQueryClient().getDefaultOptions()

    expect(defaults.queries?.retry).toBe(shouldRetry)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
    expect(defaults.mutations?.retry).toBe(false)
  })

  it('sends exactly one request for a 404', async () => {
    const client = createQueryClient()
    const queryFn = vi.fn().mockRejectedValue(apiError(404))

    await expect(
      client.fetchQuery({ queryKey: ['event', 999], queryFn, retryDelay: 0 }),
    ).rejects.toMatchObject({ status: 404 })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('sends exactly two requests when a read fails twice with 503', async () => {
    const client = createQueryClient()
    const queryFn = vi.fn().mockRejectedValue(apiError(503))

    await expect(
      client.fetchQuery({ queryKey: ['events'], queryFn, retryDelay: 0 }),
    ).rejects.toMatchObject({ status: 503 })
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('never retries a failed write', async () => {
    const client = createQueryClient()
    const mutationFn = vi.fn().mockRejectedValue(apiError(503))

    await expect(
      client.getMutationCache().build(client, { mutationFn }).execute(undefined),
    ).rejects.toMatchObject({ status: 503 })
    expect(mutationFn).toHaveBeenCalledTimes(1)
  })
})
