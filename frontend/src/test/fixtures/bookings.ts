import type { BookingResponse } from '../../types/booking'

export const jazzBooking: BookingResponse = {
  id: 42,
  userId: 7,
  userFirstName: 'Mel',
  userLastName: 'García',
  userEmail: 'mel@booqi.com',
  eventId: 4,
  eventTitle: 'Jazz en Madrid',
  eventDescription: 'Una noche de jazz en directo con los mejores cuartetos de la ciudad.',
  eventStartDate: '2030-11-10T21:00:00',
  eventLocation: 'IFEMA, Madrid',
  ticketQuantity: 3,
  basePrice: 12.5,
  totalPrice: 37.5,
  status: 'CONFIRMED',
  createdAt: '2030-01-12T10:00:00',
  updatedAt: '2030-01-12T10:00:05',
}

export function bookingWith(overrides: Partial<BookingResponse>): BookingResponse {
  return { ...jazzBooking, ...overrides }
}
