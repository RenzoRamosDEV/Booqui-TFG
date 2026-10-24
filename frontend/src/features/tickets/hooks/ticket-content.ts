import { formatDateTime } from '../../../lib/dates'
import { slugify } from '../../../lib/text'
import type { BookingResponse } from '../../../types/booking'

export type TicketPage = {
  bookingId: number
  code: string
  qrText: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  buyerName: string
  ticketLabel: string
}

function printable(bookings: BookingResponse[]) {
  return bookings.filter((booking) => booking.status !== 'CANCELLED')
}

export function ticketPages(bookings: BookingResponse[]): TicketPage[] {
  return printable(bookings).flatMap((booking) =>
    Array.from({ length: booking.ticketQuantity }, (_, index) => ({
      bookingId: booking.id,
      code: String(booking.id),
      qrText: String(booking.id),
      eventTitle: booking.eventTitle,
      eventDate: formatDateTime(booking.eventStartDate),
      eventLocation: booking.eventLocation,
      buyerName: `${booking.userFirstName} ${booking.userLastName}`,
      ticketLabel: `${index + 1} / ${booking.ticketQuantity}`,
    })),
  )
}

export function ticketFileName(bookings: BookingResponse[]): string {
  const tickets = printable(bookings)
  const slug = slugify(tickets[0]?.eventTitle ?? '') || 'entradas'
  return `${['booqi', slug, ...tickets.map((booking) => booking.id)].join('-')}.pdf`
}
