import { z } from 'zod'
import { http } from '../../../lib/http'
import type { BookingResponse, CreateBookingRequest } from '../../../types/booking'
import { bookingResponseSchema } from './schemas'

const BASE = '/api/v1/bookings'

export const bookingKeys = {
  all: ['bookings'] as const,
  byUser: (userId: number) => ['bookings', 'user', userId] as const,
}

export async function createBooking({
  userId,
  eventId,
  ticketQuantity,
}: CreateBookingRequest): Promise<BookingResponse> {
  const { data } = await http.post<unknown>(BASE, { userId, eventId, ticketQuantity })
  return bookingResponseSchema.parse(data)
}

export async function listBookingsByUser(userId: number): Promise<BookingResponse[]> {
  const { data } = await http.get<unknown>(BASE, { params: { userId } })
  return z.array(bookingResponseSchema).parse(data)
}

export async function listBookings(): Promise<BookingResponse[]> {
  const { data } = await http.get<unknown>(BASE)
  return z.array(bookingResponseSchema).parse(data)
}

export async function cancelBooking(id: number): Promise<BookingResponse> {
  const { data } = await http.patch<unknown>(`${BASE}/${id}/cancel`)
  return bookingResponseSchema.parse(data)
}
