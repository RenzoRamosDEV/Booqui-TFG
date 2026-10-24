import { z } from 'zod'
import { http } from '../../../lib/http'
import type { CreatePaymentRequest, PaymentResponse } from '../../../types/payment'
import { paymentResponseSchema } from './schemas'

const BASE = '/api/v1/payments'

export const paymentKeys = {
  all: ['payments'] as const,
}

export async function createPayment(body: CreatePaymentRequest): Promise<PaymentResponse> {
  const { data } = await http.post<unknown>(BASE, body)
  return paymentResponseSchema.parse(data)
}

export async function listPayments(): Promise<PaymentResponse[]> {
  const { data } = await http.get<unknown>(BASE)
  return z.array(paymentResponseSchema).parse(data)
}
