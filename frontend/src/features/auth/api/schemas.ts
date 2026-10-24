import { z } from 'zod'
import type { UserResponse } from '../../../types/user'

export const userResponseSchema = z.object({
  id: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string(),
  role: z.enum(['ADMIN', 'CUSTOMER']),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<UserResponse>
