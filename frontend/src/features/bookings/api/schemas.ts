import { z } from 'zod'
import type { BookingResponse } from '../../../types/booking'

export const bookingResponseSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  userFirstName: z.string(),
  userLastName: z.string(),
  userEmail: z.string(),
  eventId: z.number().int(),
  eventTitle: z.string(),
  eventDescription: z.string().nullable(),
  eventStartDate: z.string(),
  eventLocation: z.string(),
  ticketQuantity: z.number().int(),
  basePrice: z.number(),
  totalPrice: z.number(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<BookingResponse>
