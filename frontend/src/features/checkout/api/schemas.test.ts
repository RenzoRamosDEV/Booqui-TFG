import { approvedPayment, rejectedPayment } from '../../../test/fixtures/payments'
import { paymentResponseSchema } from './schemas'

describe('paymentResponseSchema', () => {
  it('parses an approved contract example', () => {
    expect(paymentResponseSchema.parse(approvedPayment)).toEqual(approvedPayment)
  })

  it('parses a rejected payment with null transactionId and paymentDate', () => {
    expect(paymentResponseSchema.parse(rejectedPayment)).toEqual(rejectedPayment)
  })

  it.each(['APPROVED', 'REJECTED', 'PENDING'])('accepts status %s', (status) => {
    expect(paymentResponseSchema.safeParse({ ...approvedPayment, status }).success).toBe(true)
  })

  it.each(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER'])(
    'accepts method %s',
    (paymentMethod) => {
      expect(paymentResponseSchema.safeParse({ ...approvedPayment, paymentMethod }).success).toBe(
        true,
      )
    },
  )

  it.each(Object.keys(approvedPayment))('rejects a payment without %s', (field) => {
    const payment: Record<string, unknown> = { ...approvedPayment }
    delete payment[field]

    expect(paymentResponseSchema.safeParse(payment).success).toBe(false)
  })

  it.each([
    ['unknown status', { status: 'REFUNDED' }],
    ['unknown method', { paymentMethod: 'CASH' }],
    ['string id', { id: '100' }],
    ['fractional id', { id: 1.5 }],
    ['string bookingId', { bookingId: '42' }],
    ['string userId', { userId: '7' }],
    ['string eventId', { eventId: '4' }],
    ['string ticketQuantity', { ticketQuantity: '3' }],
    ['string totalPrice', { totalPrice: '37.5' }],
    ['numeric transactionId', { transactionId: 1 }],
    ['numeric errorMessage', { errorMessage: 1 }],
    ['numeric paymentDate', { paymentDate: 1 }],
    ['numeric createdAt', { createdAt: 1 }],
    ['null updatedAt', { updatedAt: null }],
  ])('rejects %s', (_case, patch) => {
    expect(paymentResponseSchema.safeParse({ ...approvedPayment, ...patch }).success).toBe(false)
  })
})
