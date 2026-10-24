import { z } from 'zod'
import type { PaymentResponse } from '../../../types/payment'

export const paymentResponseSchema = z.object({
  id: z.number().int(),
  bookingId: z.number().int(),
  userId: z.number().int(),
  eventId: z.number().int(),
  ticketQuantity: z.number().int(),
  totalPrice: z.number(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER']),
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
  transactionId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  paymentDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<PaymentResponse>
