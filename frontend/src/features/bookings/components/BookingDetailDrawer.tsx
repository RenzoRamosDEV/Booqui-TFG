import type { ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import { Drawer } from '../../../components/ui/Drawer'
import { formatDateTime } from '../../../lib/dates'
import { formatEuro, toCents } from '../../../lib/money'
import type { BookingResponse } from '../../../types/booking'
import { BookingQr } from '../../tickets/components/BookingQr'
import { DownloadTicketsButton } from '../../tickets/components/DownloadTicketsButton'
import { BookingStatusBadge } from './BookingStatusBadge'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-fg-muted uppercase">{label}</dt>
      <dd className="text-sm text-fg">{children}</dd>
    </div>
  )
}

export type BookingDetailDrawerProps = {
  booking: BookingResponse | null
  onClose: () => void
  onCancel: (booking: BookingResponse) => void
}

export function BookingDetailDrawer({ booking, onClose, onCancel }: BookingDetailDrawerProps) {
  const active = booking !== null && booking.status !== 'CANCELLED'
  return (
    <Drawer
      open={booking !== null}
      onClose={onClose}
      title={booking?.eventTitle ?? ''}
      className="w-[26rem]"
    >
      {booking && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 rounded-lg bg-brand-50/70 p-4 dark:bg-brand-400/10">
            <BookingQr bookingId={booking.id} className="size-28" />
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
                Código de reserva
              </span>
              <span className="font-display text-3xl font-bold text-fg">{booking.id}</span>
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
          <dl className="grid gap-4">
            {booking.eventDescription && <Row label="Descripción">{booking.eventDescription}</Row>}
            <Row label="Fecha">{formatDateTime(booking.eventStartDate)}</Row>
            <Row label="Lugar">{booking.eventLocation}</Row>
            <div className="grid grid-cols-3 gap-4">
              <Row label="Entradas">{booking.ticketQuantity}</Row>
              <Row label="Precio">{formatEuro(toCents(booking.basePrice))}</Row>
              <Row label="Total">{formatEuro(toCents(booking.totalPrice))}</Row>
            </div>
            <Row label="Reservada el">{formatDateTime(booking.createdAt)}</Row>
          </dl>
          {active && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <DownloadTicketsButton bookings={[booking]} variant="primary" />
              <Button
                variant="ghost"
                onClick={() => onCancel(booking)}
                className="text-danger hover:bg-danger/10 dark:hover:bg-danger/10"
              >
                Cancelar reserva
              </Button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
