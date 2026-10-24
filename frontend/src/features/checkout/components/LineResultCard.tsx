import { CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { formatEuro } from '../../../lib/money'
import { userMessage } from '../../../lib/error-messages'
import { lineTotalCents } from '../../cart/hooks/cart-store'
import { BookingQr } from '../../tickets/components/BookingQr'
import { DownloadTicketsButton } from '../../tickets/components/DownloadTicketsButton'
import type { LineResult } from '../hooks/run-checkout'

function Summary({ result }: { result: LineResult }) {
  return (
    <p className="text-sm text-fg-muted">
      {result.line.quantity} {result.line.quantity === 1 ? 'entrada' : 'entradas'} ·{' '}
      {formatEuro(lineTotalCents(result.line))}
    </p>
  )
}

export function LineResultCard({ result }: { result: LineResult }) {
  const title = result.line.event.title
  const frame =
    'flex flex-col gap-4 rounded-lg border bg-surface p-5 shadow-sm sm:flex-row sm:items-center'

  if (result.kind === 'approved') {
    return (
      <li aria-label={title} className={`${frame} border-success/30`}>
        <BookingQr bookingId={result.booking.id} className="mx-auto sm:mx-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Badge tone="success" className="w-fit">
            <CircleCheck aria-hidden="true" className="size-3.5" />
            Pagado
          </Badge>
          <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
          <Summary result={result} />
          <p className="text-sm text-fg-muted">
            Código de reserva{' '}
            <strong className="font-display text-lg text-fg">{result.booking.id}</strong>
          </p>
        </div>
        <DownloadTicketsButton bookings={[result.booking]} />
      </li>
    )
  }

  const rejected = result.kind === 'rejected'
  return (
    <li aria-label={title} className={`${frame} border-danger/30`}>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
        {rejected ? (
          <CircleX aria-hidden="true" className="size-6" />
        ) : (
          <CircleAlert aria-hidden="true" className="size-6" />
        )}
      </span>
      <div className="flex flex-1 flex-col gap-2">
        <Badge tone="danger" className="w-fit">
          {rejected ? 'Pago rechazado' : 'No se pudo completar'}
        </Badge>
        <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
        <Summary result={result} />
        <p className="text-sm text-fg">{rejected ? result.reason : userMessage(result.error)}</p>
        <p className="text-xs text-fg-muted">
          Sigue en tu carrito para que puedas intentarlo de nuevo.
        </p>
      </div>
    </li>
  )
}
