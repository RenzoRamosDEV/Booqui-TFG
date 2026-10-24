import { act, renderHook } from '@testing-library/react'
import { ApiError } from './api-error'
import { isNetworkError, useOnlineStatus } from './network'

function apiError(status: number) {
  return new ApiError({ status, title: '', detail: '' })
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value })
}

afterEach(() => {
  setOnline(true)
})

describe('isNetworkError', () => {
  it('is true for an ApiError without response (status 0)', () => {
    expect(isNetworkError(apiError(0))).toBe(true)
  })

  it.each([404, 500, 503, -1])('is false for ApiError status %i', (status) => {
    expect(isNetworkError(apiError(status))).toBe(false)
  })

  it.each([
    ['plain Error', new Error('boom')],
    ['status-like object', { status: 0 }],
    ['null', null],
  ])('is false for %s', (_case, value) => {
    expect(isNetworkError(value)).toBe(false)
  })
})

describe('useOnlineStatus', () => {
  it.each([true, false])('starts from navigator.onLine = %s', (online) => {
    setOnline(online)

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(online)
  })

  it('follows offline and online events', () => {
    setOnline(true)
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })

  it('stops listening after unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOnlineStatus())

    unmount()

    const removed = remove.mock.calls.map(([type]) => type)
    expect(removed).toEqual(expect.arrayContaining(['online', 'offline']))
  })
})
