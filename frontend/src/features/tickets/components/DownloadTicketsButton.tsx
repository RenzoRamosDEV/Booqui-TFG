import { Download } from 'lucide-react'
import { useState } from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/use-toast'
import { downloadBlob } from '../../../lib/download'
import type { BookingResponse } from '../../../types/booking'
import { ticketFileName, ticketPages, type TicketPage } from '../hooks/ticket-content'

export type RenderTicketPdf = (pages: TicketPage[]) => Promise<Blob>

const renderOnDemand: RenderTicketPdf = async (pages) => {
  const { renderTicketPdf } = await import('../render-ticket-pdf')
  return renderTicketPdf(pages)
}

export type DownloadTicketsButtonProps = {
  bookings: BookingResponse[]
  renderPdf?: RenderTicketPdf
  label?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function DownloadTicketsButton({
  bookings,
  renderPdf = renderOnDemand,
  label = 'Descargar entradas',
  variant = 'secondary',
  size = 'md',
  className,
}: DownloadTicketsButtonProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const pages = ticketPages(bookings)

  async function download() {
    setBusy(true)
    try {
      downloadBlob(await renderPdf(pages), ticketFileName(bookings))
    } catch {
      toast.show({
        tone: 'danger',
        title: 'No se pudieron generar las entradas',
        description: 'Inténtalo de nuevo en unos segundos.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      loading={busy}
      disabled={pages.length === 0}
      onClick={download}
      className={className}
      aria-label={label}
    >
      <Download aria-hidden="true" className="size-4" />
      {label}
    </Button>
  )
}
