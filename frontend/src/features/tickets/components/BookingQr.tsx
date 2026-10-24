import { useEffect, useState } from 'react'
import { Skeleton } from '../../../components/ui/Skeleton'
import { cn } from '../../../lib/cn'
import { qrDataUrl } from '../qr'

export type BookingQrProps = {
  bookingId: number
  generate?: (bookingId: number) => Promise<string>
  className?: string
}

export function BookingQr({ bookingId, generate = qrDataUrl, className }: BookingQrProps) {
  const [qr, setQr] = useState<{ id: number; url: string } | null>(null)

  useEffect(() => {
    let active = true
    generate(bookingId).then(
      (url) => active && setQr({ id: bookingId, url }),
      () => active && setQr(null),
    )
    return () => {
      active = false
    }
  }, [bookingId, generate])

  const frame = cn(
    'size-36 shrink-0 overflow-hidden rounded-lg bg-white p-2 shadow-sm ring-1 ring-border',
    className,
  )
  if (qr?.id !== bookingId) {
    return (
      <div aria-busy="true" aria-label="Generando código QR" className={frame}>
        <Skeleton className="size-full bg-brand-100" />
      </div>
    )
  }
  return (
    <div className={frame}>
      <img
        src={qr.url}
        alt={`Código QR de la reserva ${bookingId}`}
        className="size-full [image-rendering:pixelated]"
      />
    </div>
  )
}
