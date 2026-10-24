import { Eye, MapPin, Ticket, XCircle } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { formatDate, formatTime, parseLocalDate } from '../../../lib/dates'
import { formatEuro, toCents } from '../../../lib/money'
import type { BookingResponse } from '../../../types/booking'
import { ticketPages } from '../../tickets/hooks/ticket-content'
import { DownloadTicketsButton } from '../../tickets/components/DownloadTicketsButton'
import type { BookingGroup } from '../hooks/group-bookings'
import { BookingStatusBadge } from './BookingStatusBadge'

const month = new Intl.DateTimeFormat('es-ES', { month: 'short' })

function DateTile({ iso }: { iso: string }) {
  const date = parseLocalDate(iso)
  return (
    <div
      aria-hidden="true"
      className="flex size-16 shrink-0 flex-col items-center justify-center rounded-lg bg-gradient-brand text-white shadow-md shadow-brand-600/25 dark:bg-none dark:bg-primary dark:text-primary-fg dark:shadow-none"
    >
      <span className="text-xs font-semibold uppercase">{month.format(date).replace('.', '')}</span>
      <span className="font-display text-2xl leading-none font-bold">{date.getDate()}</span>
    </div>
  )
}

function ticketsLabel(count: number) {
  return count === 1 ? '1 entrada' : `${count} entradas`
}

export type BookingGroupCardProps = {
  group: BookingGroup
  onDetail: (booking: BookingResponse) => void
  onCancel: (booking: BookingResponse) => void
}

export function BookingGroupCard({ group, onDetail, onCancel }: BookingGroupCardProps) {
  const printable = ticketPages(group.bookings).length > 0
  return (
    <article
      aria-label={group.eventTitle}
      className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 shadow-md sm:p-6 dark:shadow-sm"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <DateTile iso={group.eventStartDate} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-fg">{group.eventTitle}</h2>
            <BookingStatusBadge status={group.status} testId="group-status" />
          </div>
          <p className="text-sm text-fg-muted">
            {formatDate(group.eventStartDate)} · {formatTime(group.eventStartDate)}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            {group.eventLocation}
          </p>
          <p data-testid="group-total" className="mt-1 text-sm font-semibold text-fg">
            {ticketsLabel(group.totalTickets)} · {formatEuro(group.totalCents)}
          </p>
        </div>
        {printable && (
          <DownloadTicketsButton
            bookings={group.bookings}
            label={`Descargar entradas de ${group.eventTitle}`}
            size="sm"
          />
        )}
      </header>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {group.bookings.map((booking) => (
          <li
            key={booking.id}
            aria-label={`Reserva ${booking.id}`}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
                <Ticket aria-hidden="true" className="size-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-fg">Reserva #{booking.id}</span>
                <span className="text-xs text-fg-muted">
                  {ticketsLabel(booking.ticketQuantity)} · {formatEuro(toCents(booking.totalPrice))}
                </span>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Ver detalle de la reserva ${booking.id}`}
                onClick={() => onDetail(booking)}
              >
                <Eye aria-hidden="true" className="size-4" />
                Detalle
              </Button>
              {booking.status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Cancelar reserva ${booking.id}`}
                  onClick={() => onCancel(booking)}
                  className="text-danger hover:bg-danger/10 dark:hover:bg-danger/10"
                >
                  <XCircle aria-hidden="true" className="size-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
