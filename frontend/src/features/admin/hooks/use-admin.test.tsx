import { act, renderHook, waitFor } from '@testing-library/react'
import { installFakeApi } from '../../../test/fake-api'
import { jazzBooking } from '../../../test/fixtures/bookings'
import { jazzEvent } from '../../../test/fixtures/events'
import { approvedPayment } from '../../../test/fixtures/payments'
import { hookWrapper } from '../../../test/hook-wrapper'
import { userWith } from '../../../test/users'
import type { CreateEventRequest } from '../../../types/event'
import { userKeys } from '../../auth/api/users-api'
import { bookingKeys } from '../../bookings/api/bookings-api'
import { paymentKeys } from '../../checkout/api/payments-api'
import { eventKeys } from '../../events/api/events-api'
import {
  useCreateEvent,
  useDeleteEvent,
  useDeleteUser,
  useUpdateEvent,
} from './use-admin-mutations'
import { useAllBookings, usePayments, useUsers } from './use-admin-queries'

const request: CreateEventRequest = {
  title: 'Jazz en Madrid',
  availableTickets: 50,
  location: 'IFEMA, Madrid',
  startDate: '2030-11-10T21:00:00',
  endDate: '2030-11-10T23:30:00',
  organizer: 'Blue Note Madrid',
  price: 12.5,
  category: 'Música',
  contactEmail: 'jazz@booqi.com',
  contactPhone: '+34600111222',
}

function setup() {
  const { wrapper, queryClient } = hookWrapper()
  for (const key of [eventKeys.all, userKeys.all, ['other']]) queryClient.setQueryData(key, [])
  const invalidated = (key: readonly unknown[]) => queryClient.getQueryState(key)?.isInvalidated
  return { wrapper, invalidated }
}

describe('admin mutations', () => {
  it('creating an event posts it and refreshes the events', async () => {
    const api = installFakeApi()
    api.post('/api/v1/events', { status: 201, data: jazzEvent })
    const { wrapper, invalidated } = setup()
    const { result } = renderHook(() => useCreateEvent(), { wrapper })

    await act(() => result.current.mutateAsync(request))

    expect(api.requests[0]).toMatchObject({ method: 'POST', path: '/api/v1/events', body: request })
    expect(invalidated(eventKeys.all)).toBe(true)
    expect(invalidated(['other'])).toBe(false)
  })

  it('updating an event sends the patch and refreshes the events', async () => {
    const api = installFakeApi()
    api.put('/api/v1/events/4', { status: 200, data: { ...jazzEvent, price: 25 } })
    const { wrapper, invalidated } = setup()
    const { result } = renderHook(() => useUpdateEvent(), { wrapper })

    await act(() => result.current.mutateAsync({ id: 4, patch: { price: 25 } }))

    expect(api.requests[0]).toMatchObject({
      method: 'PUT',
      path: '/api/v1/events/4',
      body: { price: 25 },
    })
    expect(invalidated(eventKeys.all)).toBe(true)
    expect(invalidated(['other'])).toBe(false)
  })

  it('deleting an event refreshes the events', async () => {
    const api = installFakeApi()
    api.delete('/api/v1/events/4', { status: 204 })
    const { wrapper, invalidated } = setup()
    const { result } = renderHook(() => useDeleteEvent(), { wrapper })

    await act(() => result.current.mutateAsync(4))

    expect(api.requests[0]).toMatchObject({ method: 'DELETE', path: '/api/v1/events/4' })
    expect(invalidated(eventKeys.all)).toBe(true)
    expect(invalidated(['other'])).toBe(false)
  })

  it('deleting a user refreshes the users', async () => {
    const api = installFakeApi()
    api.delete('/api/v1/users/9', { status: 204 })
    const { wrapper, invalidated } = setup()
    const { result } = renderHook(() => useDeleteUser(), { wrapper })

    await act(() => result.current.mutateAsync(9))

    expect(api.requests[0]).toMatchObject({ method: 'DELETE', path: '/api/v1/users/9' })
    expect(invalidated(userKeys.all)).toBe(true)
    expect(invalidated(['other'])).toBe(false)
  })
})

describe('admin queries', () => {
  it.each([
    ['useUsers', useUsers, '/api/v1/users', [userWith('ADMIN')], userKeys.all],
    ['usePayments', usePayments, '/api/v1/payments', [approvedPayment], paymentKeys.all],
    ['useAllBookings', useAllBookings, '/api/v1/bookings', [jazzBooking], bookingKeys.all],
  ] as const)('%s loads every record under its key', async (_name, hook, path, data, key) => {
    const api = installFakeApi()
    api.get(path, { status: 200, data })
    const { wrapper, queryClient } = hookWrapper()

    const { result } = renderHook(() => hook(), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(data))
    expect(api.requests.map((request) => request.url)).toEqual([path])
    expect(queryClient.getQueryData(key)).toEqual(data)
  })
})
