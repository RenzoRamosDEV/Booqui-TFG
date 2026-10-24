import type { BadgeTone } from '../../../components/ui/Badge'
import { toCents } from '../../../lib/money'
import type { BookingResponse, BookingStatus } from '../../../types/booking'

export type BookingGroup = {
  eventId: number
  eventTitle: string
  eventStartDate: string
  eventLocation: string
  bookings: BookingResponse[]
  totalTickets: number
  totalCents: number
  status: BookingStatus
}

const labels: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
}

const tones: Record<BookingStatus, BadgeTone> = {
  CONFIRMED: 'success',
  PENDING: 'warning',
  CANCELLED: 'danger',
}

export function bookingStatusLabel(status: BookingStatus): string {
  return labels[status]
}

export function bookingStatusTone(status: BookingStatus): BadgeTone {
  return tones[status]
}

export function groupStatus(bookings: BookingResponse[]): BookingStatus {
  if (bookings.every((booking) => booking.status === 'CONFIRMED')) return 'CONFIRMED'
  if (bookings.every((booking) => booking.status === 'CANCELLED')) return 'CANCELLED'
  return 'PENDING'
}

function toGroup(bookings: BookingResponse[]): BookingGroup {
  const [first] = bookings as [BookingResponse, ...BookingResponse[]]
  const active = bookings.filter((booking) => booking.status !== 'CANCELLED')
  return {
    eventId: first.eventId,
    eventTitle: first.eventTitle,
    eventStartDate: first.eventStartDate,
    eventLocation: first.eventLocation,
    bookings: [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    totalTickets: active.reduce((total, booking) => total + booking.ticketQuantity, 0),
    totalCents: active.reduce((total, booking) => total + toCents(booking.totalPrice), 0),
    status: groupStatus(bookings),
  }
}

export function groupBookingsByEvent(bookings: BookingResponse[]): BookingGroup[] {
  const byEvent = new Map<number, BookingResponse[]>()
  for (const booking of bookings) {
    byEvent.set(booking.eventId, [...(byEvent.get(booking.eventId) ?? []), booking])
  }
  return [...byEvent.values()]
    .map(toGroup)
    .sort((a, b) => b.eventStartDate.localeCompare(a.eventStartDate))
}
