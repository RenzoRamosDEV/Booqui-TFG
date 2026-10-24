import { jazzBooking } from '../../../test/fixtures/bookings'
import { bookingResponseSchema } from './schemas'

describe('bookingResponseSchema', () => {
  it('parses a contract example', () => {
    expect(bookingResponseSchema.parse(jazzBooking)).toEqual(jazzBooking)
  })

  it('accepts a null eventDescription', () => {
    const booking = { ...jazzBooking, eventDescription: null }

    expect(bookingResponseSchema.parse(booking)).toEqual(booking)
  })

  it.each(['PENDING', 'CONFIRMED', 'CANCELLED'])('accepts status %s', (status) => {
    expect(bookingResponseSchema.safeParse({ ...jazzBooking, status }).success).toBe(true)
  })

  it.each(Object.keys(jazzBooking))('rejects a booking without %s', (field) => {
    const booking: Record<string, unknown> = { ...jazzBooking }
    delete booking[field]

    expect(bookingResponseSchema.safeParse(booking).success).toBe(false)
  })

  it.each([
    ['unknown status', { status: 'REFUNDED' }],
    ['lowercase status', { status: 'confirmed' }],
    ['string id', { id: '42' }],
    ['fractional id', { id: 42.5 }],
    ['string userId', { userId: '7' }],
    ['numeric userFirstName', { userFirstName: 1 }],
    ['numeric userLastName', { userLastName: 1 }],
    ['numeric userEmail', { userEmail: 1 }],
    ['string eventId', { eventId: '4' }],
    ['numeric eventTitle', { eventTitle: 1 }],
    ['numeric eventDescription', { eventDescription: 1 }],
    ['numeric eventStartDate', { eventStartDate: 1 }],
    ['numeric eventLocation', { eventLocation: 1 }],
    ['string ticketQuantity', { ticketQuantity: '3' }],
    ['fractional ticketQuantity', { ticketQuantity: 1.5 }],
    ['string basePrice', { basePrice: '12.5' }],
    ['string totalPrice', { totalPrice: '37.5' }],
    ['numeric createdAt', { createdAt: 1 }],
    ['null updatedAt', { updatedAt: null }],
  ])('rejects %s', (_case, patch) => {
    expect(bookingResponseSchema.safeParse({ ...jazzBooking, ...patch }).success).toBe(false)
  })
})
