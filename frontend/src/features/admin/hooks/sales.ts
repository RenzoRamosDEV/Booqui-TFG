import { toCents } from '../../../lib/money'
import type { BookingResponse, BookingStatus } from '../../../types/booking'
import type { PaymentMethod, PaymentResponse, PaymentStatus } from '../../../types/payment'

export type SalesRow = {
  paymentId: number
  bookingId: number
  eventId: number
  eventTitle: string
  customer: string
  customerEmail: string
  tickets: number
  amountCents: number
  method: PaymentMethod
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus | null
  date: string
}

export type SalesFilter = { status: PaymentStatus | 'ALL'; eventId: number | null }

export type SalesTotals = {
  approvedCents: number
  rejectedCents: number
  pendingCents: number
  count: number
}

function toRow(payment: PaymentResponse, booking: BookingResponse | undefined): SalesRow {
  return {
    paymentId: payment.id,
    bookingId: payment.bookingId,
    eventId: payment.eventId,
    eventTitle: booking?.eventTitle ?? `Evento ${payment.eventId}`,
    customer: booking
      ? `${booking.userFirstName} ${booking.userLastName}`
      : `Usuario ${payment.userId}`,
    customerEmail: booking?.userEmail ?? '',
    tickets: payment.ticketQuantity,
    amountCents: toCents(payment.totalPrice),
    method: payment.paymentMethod,
    paymentStatus: payment.status,
    bookingStatus: booking?.status ?? null,
    date: payment.paymentDate ?? payment.createdAt,
  }
}

/** Joins payments with bookings by booking id; a payment whose booking is gone is still listed. */
export function buildSalesRows(
  payments: PaymentResponse[],
  bookings: BookingResponse[],
): SalesRow[] {
  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]))
  return payments
    .map((payment) => toRow(payment, bookingsById.get(payment.bookingId)))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function filterSalesRows(rows: SalesRow[], { status, eventId }: SalesFilter): SalesRow[] {
  return rows.filter(
    (row) =>
      (status === 'ALL' || row.paymentStatus === status) &&
      (eventId === null || row.eventId === eventId),
  )
}

function sumFor(rows: SalesRow[], status: PaymentStatus) {
  return rows
    .filter((row) => row.paymentStatus === status)
    .reduce((total, row) => total + row.amountCents, 0)
}

export function salesTotals(rows: SalesRow[]): SalesTotals {
  return {
    approvedCents: sumFor(rows, 'APPROVED'),
    rejectedCents: sumFor(rows, 'REJECTED'),
    pendingCents: sumFor(rows, 'PENDING'),
    count: rows.length,
  }
}
