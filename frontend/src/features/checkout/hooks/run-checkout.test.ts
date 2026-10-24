import { ApiError } from '../../../lib/api-error'
import { bookingWith } from '../../../test/fixtures/bookings'
import { eventWith } from '../../../test/fixtures/events'
import { paymentWith, rejectedPayment } from '../../../test/fixtures/payments'
import type { CreateBookingRequest } from '../../../types/booking'
import type { CreatePaymentRequest } from '../../../types/payment'
import type { CartLine } from '../../cart/hooks/cart-store'
import { runCheckout, type CheckoutDeps } from './run-checkout'

const jazzLine: CartLine = { event: eventWith({ id: 4, price: 12.5 }), quantity: 2 }
const rockLine: CartLine = { event: eventWith({ id: 7, price: 30 }), quantity: 1 }
const card = { userId: 7, method: 'CREDIT_CARD' as const, cardNumber: '4242424242424242' }

/** In-memory backend: bookings get ids from 42, payments approve unless told otherwise. */
function fakeBackend({
  failBooking = new Set<number>(),
  failPayment = new Map<number, ApiError>(),
  reject = new Set<number>(),
} = {}) {
  const calls: string[] = []
  const payments: CreatePaymentRequest[] = []
  let nextBooking = 42
  const deps: CheckoutDeps = {
    createBooking: async (request: CreateBookingRequest) => {
      calls.push(`booking:${request.eventId}`)
      if (failBooking.has(request.eventId)) {
        throw new ApiError({ status: 503, title: '', detail: 'User service is unavailable' })
      }
      return bookingWith({
        id: nextBooking++,
        eventId: request.eventId,
        ticketQuantity: request.ticketQuantity,
        status: 'PENDING',
      })
    },
    createPayment: async (request: CreatePaymentRequest) => {
      calls.push(`payment:${request.eventId}`)
      payments.push(request)
      const failure = failPayment.get(request.eventId)
      if (failure) throw failure
      return reject.has(request.eventId)
        ? { ...rejectedPayment, bookingId: request.bookingId, eventId: request.eventId }
        : paymentWith({ bookingId: request.bookingId, eventId: request.eventId })
    },
  }
  return { deps, calls, payments }
}

describe('runCheckout', () => {
  it('books then pays each line in order', async () => {
    const backend = fakeBackend()

    await runCheckout([jazzLine, rockLine], card, backend.deps)

    expect(backend.calls).toEqual(['booking:4', 'payment:4', 'booking:7', 'payment:7'])
  })

  it('pays with the booking id, the line total and the card digits', async () => {
    const backend = fakeBackend()

    await runCheckout([jazzLine, rockLine], card, backend.deps)

    expect(backend.payments).toStrictEqual([
      {
        bookingId: 42,
        userId: 7,
        eventId: 4,
        ticketQuantity: 2,
        totalPrice: 25,
        paymentMethod: 'CREDIT_CARD',
        cardNumber: '4242424242424242',
      },
      {
        bookingId: 43,
        userId: 7,
        eventId: 7,
        ticketQuantity: 1,
        totalPrice: 30,
        paymentMethod: 'CREDIT_CARD',
        cardNumber: '4242424242424242',
      },
    ])
  })

  it('sends cardNumber null with PayPal', async () => {
    const backend = fakeBackend()

    await runCheckout([jazzLine], { userId: 7, method: 'PAYPAL', cardNumber: null }, backend.deps)

    expect(backend.payments[0]).toMatchObject({ paymentMethod: 'PAYPAL', cardNumber: null })
  })

  it('reports an approved line with its booking and payment', async () => {
    const [result] = await runCheckout([jazzLine], card, fakeBackend().deps)

    expect(result).toMatchObject({
      kind: 'approved',
      line: jazzLine,
      booking: { id: 42 },
      payment: { status: 'APPROVED', bookingId: 42 },
    })
  })

  it('reports a 201 REJECTED payment as rejected with its message', async () => {
    const [result] = await runCheckout([jazzLine], card, fakeBackend({ reject: new Set([4]) }).deps)

    expect(result).toMatchObject({
      kind: 'rejected',
      booking: { id: 42 },
      reason: 'Payment rejected by simulation',
    })
  })

  it('treats any status other than APPROVED as not approved', async () => {
    const deps: CheckoutDeps = {
      createBooking: async () => bookingWith({ id: 42 }),
      createPayment: async () => paymentWith({ status: 'PENDING', errorMessage: null }),
    }

    const [result] = await runCheckout([jazzLine], card, deps)

    expect(result).toMatchObject({ kind: 'rejected', reason: 'El pago no se ha aprobado.' })
  })

  it('skips the payment of a line whose booking fails and goes on with the next', async () => {
    const backend = fakeBackend({ failBooking: new Set([4]) })

    const results = await runCheckout([jazzLine, rockLine], card, backend.deps)

    expect(backend.calls).toEqual(['booking:4', 'booking:7', 'payment:7'])
    expect(results[0]).toMatchObject({ kind: 'error', stage: 'booking', line: jazzLine })
    expect((results[0] as { error: ApiError }).error.status).toBe(503)
    expect(results[1]).toMatchObject({ kind: 'approved', line: rockLine })
  })

  it('reports a failing payment request as an error at the payment stage', async () => {
    const failure = new ApiError({
      status: 422,
      title: '',
      detail: 'Total price must not exceed 99999999.99',
    })
    const backend = fakeBackend({ failPayment: new Map([[4, failure]]) })

    const [result] = await runCheckout([jazzLine], card, backend.deps)

    expect(result).toMatchObject({
      kind: 'error',
      stage: 'payment',
      error: failure,
      booking: { id: 42 },
    })
  })

  it('wraps unexpected failures as ApiError', async () => {
    const deps: CheckoutDeps = {
      createBooking: async () => {
        throw new Error('schema drift')
      },
      createPayment: async () => paymentWith({}),
    }

    const [result] = await runCheckout([jazzLine], card, deps)

    expect((result as { error: unknown }).error).toBeInstanceOf(ApiError)
  })

  it('reports progress before each line', async () => {
    const progress: number[] = []

    await runCheckout([jazzLine, rockLine], card, fakeBackend().deps, (index) =>
      progress.push(index),
    )

    expect(progress).toEqual([0, 1])
  })

  it('returns nothing for an empty cart', async () => {
    const backend = fakeBackend()

    expect(await runCheckout([], card, backend.deps)).toEqual([])
    expect(backend.calls).toEqual([])
  })
})
