import { ApiError } from '../../../lib/api-error'
import { installFakeApi } from '../../../test/fake-api'
import { bookingWith, jazzBooking } from '../../../test/fixtures/bookings'
import {
  bookingKeys,
  cancelBooking,
  createBooking,
  listBookings,
  listBookingsByUser,
} from './bookings-api'

describe('bookings api', () => {
  it('creates a booking with exactly userId, eventId and ticketQuantity', async () => {
    const api = installFakeApi()
    api.post('/api/v1/bookings', { status: 201, data: jazzBooking })

    await expect(createBooking({ userId: 7, eventId: 4, ticketQuantity: 3 })).resolves.toEqual(
      jazzBooking,
    )
    expect(api.requests[0]!.body).toStrictEqual({ userId: 7, eventId: 4, ticketQuantity: 3 })
  })

  it('lists the bookings of one user with ?userId=', async () => {
    const api = installFakeApi()
    api.get('/api/v1/bookings', { status: 200, data: [jazzBooking] })

    await expect(listBookingsByUser(7)).resolves.toEqual([jazzBooking])
    expect(api.requests[0]!.url).toBe('/api/v1/bookings?userId=7')
  })

  it('lists every booking without query string', async () => {
    const api = installFakeApi()
    const other = bookingWith({ id: 43, userId: 9 })
    api.get('/api/v1/bookings', { status: 200, data: [jazzBooking, other] })

    await expect(listBookings()).resolves.toEqual([jazzBooking, other])
    expect(api.requests[0]!.url).toBe('/api/v1/bookings')
  })

  it('cancels a booking with PATCH /cancel', async () => {
    const api = installFakeApi()
    const cancelled = bookingWith({ status: 'CANCELLED' })
    api.patch('/api/v1/bookings/42/cancel', { status: 200, data: cancelled })

    await expect(cancelBooking(42)).resolves.toEqual(cancelled)
    expect(api.requests[0]!.method).toBe('PATCH')
  })

  it.each([
    ['createBooking', () => createBooking({ userId: 7, eventId: 4, ticketQuantity: 1 })],
    ['listBookingsByUser', () => listBookingsByUser(7)],
    ['listBookings', () => listBookings()],
    ['cancelBooking', () => cancelBooking(42)],
  ])('%s rejects a response that breaks the schema', async (_name, call) => {
    const api = installFakeApi()
    const broken = { ...jazzBooking, status: 'REFUNDED' }
    api.post('/api/v1/bookings', { status: 201, data: broken })
    api.get('/api/v1/bookings', { status: 200, data: [broken] })
    api.patch('/api/v1/bookings/42/cancel', { status: 200, data: broken })

    const error = await call().catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiError)
  })

  it('rejects HTTP failures as ApiError', async () => {
    const api = installFakeApi()
    api.post('/api/v1/bookings', { status: 503, data: { detail: 'User service is unavailable' } })

    await expect(createBooking({ userId: 7, eventId: 4, ticketQuantity: 1 })).rejects.toMatchObject(
      { status: 503, detail: 'User service is unavailable' },
    )
  })

  it('builds stable query keys', () => {
    expect(bookingKeys.all).toEqual(['bookings'])
    expect(bookingKeys.byUser(7)).toEqual(['bookings', 'user', 7])
  })
})
