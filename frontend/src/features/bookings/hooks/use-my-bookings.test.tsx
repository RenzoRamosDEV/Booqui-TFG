import { act, renderHook, waitFor } from '@testing-library/react'
import { installFakeApi } from '../../../test/fake-api'
import { bookingWith, jazzBooking } from '../../../test/fixtures/bookings'
import { hookWrapper } from '../../../test/hook-wrapper'
import { bookingKeys } from '../api/bookings-api'
import { useCancelBooking, useMyBookings } from './use-my-bookings'

describe('useMyBookings', () => {
  it('requests the bookings of the given user under their key', async () => {
    const api = installFakeApi()
    api.get('/api/v1/bookings', { status: 200, data: [jazzBooking] })
    const { wrapper, queryClient } = hookWrapper()

    const { result } = renderHook(() => useMyBookings(7), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual([jazzBooking]))
    expect(api.requests.map((request) => request.url)).toEqual(['/api/v1/bookings?userId=7'])
    expect(queryClient.getQueryData(bookingKeys.byUser(7))).toEqual([jazzBooking])
  })
})

describe('useCancelBooking', () => {
  it('sends the cancel PATCH and invalidates the booking lists', async () => {
    const api = installFakeApi()
    api.patch('/api/v1/bookings/42/cancel', {
      status: 200,
      data: bookingWith({ status: 'CANCELLED' }),
    })
    const { wrapper, queryClient } = hookWrapper()
    queryClient.setQueryData(bookingKeys.byUser(7), [jazzBooking])
    queryClient.setQueryData(['events'], [])
    const { result } = renderHook(() => useCancelBooking(), { wrapper })

    await act(() => result.current.mutateAsync(42))

    expect(api.requests.map((request) => `${request.method} ${request.url}`)).toEqual([
      'PATCH /api/v1/bookings/42/cancel',
    ])
    expect(queryClient.getQueryState(bookingKeys.byUser(7))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['events'])?.isInvalidated).toBe(false)
  })
})
