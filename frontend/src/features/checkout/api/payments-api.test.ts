import { ApiError } from '../../../lib/api-error'
import { installFakeApi } from '../../../test/fake-api'
import { approvedPayment, rejectedPayment } from '../../../test/fixtures/payments'
import type { CreatePaymentRequest } from '../../../types/payment'
import { createPayment, listPayments, paymentKeys } from './payments-api'

const request: CreatePaymentRequest = {
  bookingId: 42,
  userId: 7,
  eventId: 4,
  ticketQuantity: 3,
  totalPrice: 37.5,
  paymentMethod: 'CREDIT_CARD',
  cardNumber: '4242424242424242',
}

describe('payments api', () => {
  it.each([
    ['APPROVED', approvedPayment],
    ['REJECTED', rejectedPayment],
  ])('returns the parsed payment for a 201 %s', async (_status, payment) => {
    const api = installFakeApi()
    api.post('/api/v1/payments', { status: 201, data: payment })

    await expect(createPayment(request)).resolves.toEqual(payment)
    expect(api.requests[0]!.body).toStrictEqual(request)
  })

  it('lists every payment without query string', async () => {
    const api = installFakeApi()
    api.get('/api/v1/payments', { status: 200, data: [approvedPayment, rejectedPayment] })

    await expect(listPayments()).resolves.toEqual([approvedPayment, rejectedPayment])
    expect(api.requests[0]!.url).toBe('/api/v1/payments')
  })

  it.each([
    ['createPayment', () => createPayment(request)],
    ['listPayments', () => listPayments()],
  ])('%s rejects a response that breaks the schema', async (_name, call) => {
    const api = installFakeApi()
    const broken = { ...approvedPayment, status: 'REFUNDED' }
    api.post('/api/v1/payments', { status: 201, data: broken })
    api.get('/api/v1/payments', { status: 200, data: [broken] })

    const error = await call().catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiError)
  })

  it('rejects HTTP failures as ApiError', async () => {
    const api = installFakeApi()
    api.post('/api/v1/payments', {
      status: 422,
      data: { detail: 'Total price must not exceed 99999999.99' },
    })

    await expect(createPayment(request)).rejects.toMatchObject({
      status: 422,
      detail: 'Total price must not exceed 99999999.99',
    })
  })

  it('builds stable query keys', () => {
    expect(paymentKeys.all).toEqual(['payments'])
  })
})
