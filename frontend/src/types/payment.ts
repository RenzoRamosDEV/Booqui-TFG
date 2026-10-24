export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER'
export type PaymentStatus = 'APPROVED' | 'REJECTED' | 'PENDING'

export type PaymentResponse = {
  id: number
  bookingId: number
  userId: number
  eventId: number
  ticketQuantity: number
  totalPrice: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  transactionId: string | null
  errorMessage: string | null
  paymentDate: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePaymentRequest = {
  bookingId: number
  userId: number
  eventId: number
  ticketQuantity: number
  totalPrice: number
  paymentMethod: PaymentMethod
  cardNumber: string | null
}
