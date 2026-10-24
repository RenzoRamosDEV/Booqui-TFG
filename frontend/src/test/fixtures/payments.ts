import type { PaymentResponse } from '../../types/payment'

export const approvedPayment: PaymentResponse = {
  id: 100,
  bookingId: 42,
  userId: 7,
  eventId: 4,
  ticketQuantity: 3,
  totalPrice: 37.5,
  paymentMethod: 'CREDIT_CARD',
  status: 'APPROVED',
  transactionId: '3f1c2a9e-8d7b-4c1e-9a55-0b6f7d2e4a10',
  errorMessage: null,
  paymentDate: '2030-01-12T10:00:05',
  createdAt: '2030-01-12T10:00:04',
  updatedAt: '2030-01-12T10:00:05',
}

export const rejectedPayment: PaymentResponse = {
  ...approvedPayment,
  id: 101,
  status: 'REJECTED',
  transactionId: null,
  errorMessage: 'Payment rejected by simulation',
  paymentDate: null,
}

export function paymentWith(overrides: Partial<PaymentResponse>): PaymentResponse {
  return { ...approvedPayment, ...overrides }
}
