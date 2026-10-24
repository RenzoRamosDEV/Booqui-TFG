import { toApiError, type ApiError } from '../../../lib/api-error'
import { centsToAmount } from '../../../lib/money'
import type { BookingResponse, CreateBookingRequest } from '../../../types/booking'
import type { CreatePaymentRequest, PaymentResponse } from '../../../types/payment'
import { lineTotalCents, type CartLine } from '../../cart/hooks/cart-store'
import type { PaymentDetails } from '../api/payment-form-schema'

export type Payer = PaymentDetails & { userId: number }

export type CheckoutDeps = {
  createBooking: (request: CreateBookingRequest) => Promise<BookingResponse>
  createPayment: (request: CreatePaymentRequest) => Promise<PaymentResponse>
}

export type LineResult =
  | { kind: 'approved'; line: CartLine; booking: BookingResponse; payment: PaymentResponse }
  | {
      kind: 'rejected'
      line: CartLine
      booking: BookingResponse
      payment: PaymentResponse
      reason: string
    }
  | { kind: 'error'; line: CartLine; stage: 'booking'; error: ApiError }
  | { kind: 'error'; line: CartLine; stage: 'payment'; booking: BookingResponse; error: ApiError }

async function checkoutLine(line: CartLine, payer: Payer, deps: CheckoutDeps): Promise<LineResult> {
  let booking: BookingResponse
  try {
    booking = await deps.createBooking({
      userId: payer.userId,
      eventId: line.event.id,
      ticketQuantity: line.quantity,
    })
  } catch (error) {
    return { kind: 'error', line, stage: 'booking', error: toApiError(error) }
  }
  try {
    const payment = await deps.createPayment({
      bookingId: booking.id,
      userId: payer.userId,
      eventId: line.event.id,
      ticketQuantity: line.quantity,
      totalPrice: centsToAmount(lineTotalCents(line)),
      paymentMethod: payer.method,
      cardNumber: payer.cardNumber,
    })
    if (payment.status === 'APPROVED') return { kind: 'approved', line, booking, payment }
    const reason = payment.errorMessage ?? 'El pago no se ha aprobado.'
    return { kind: 'rejected', line, booking, payment, reason }
  } catch (error) {
    return { kind: 'error', line, stage: 'payment', booking, error: toApiError(error) }
  }
}

/** Books and pays each line in turn; a failing line never stops the next one. */
export async function runCheckout(
  lines: CartLine[],
  payer: Payer,
  deps: CheckoutDeps,
  onProgress?: (index: number) => void,
): Promise<LineResult[]> {
  const results: LineResult[] = []
  for (const [index, line] of lines.entries()) {
    onProgress?.(index)
    results.push(await checkoutLine(line, payer, deps))
  }
  return results
}
