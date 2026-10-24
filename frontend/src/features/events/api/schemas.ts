import { z } from 'zod'
import type { EventResponse } from '../../../types/event'

export const eventResponseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  availableTickets: z.number().int(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  organizer: z.string(),
  price: z.number(),
  category: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<EventResponse>
