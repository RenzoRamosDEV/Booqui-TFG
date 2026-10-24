import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../../../components/ui/Toast'
import { bookingWith, jazzBooking } from '../../../test/fixtures/bookings'
import { BookingQr } from './BookingQr'
import { DownloadTicketsButton } from './DownloadTicketsButton'

function withToasts(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

describe('DownloadTicketsButton', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:booqi/tickets')
    URL.revokeObjectURL = vi.fn()
  })

  it('is disabled for a cancelled booking', () => {
    withToasts(<DownloadTicketsButton bookings={[bookingWith({ status: 'CANCELLED' })]} />)

    expect(screen.getByRole('button', { name: 'Descargar entradas' })).toBeDisabled()
  })

  it('renders the tickets of the bookings and downloads them with the derived name', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const renderPdf = vi.fn(async () => new Blob(['%PDF'], { type: 'application/pdf' }))
    withToasts(<DownloadTicketsButton bookings={[jazzBooking]} renderPdf={renderPdf} />)

    await userEvent.click(screen.getByRole('button', { name: 'Descargar entradas' }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(renderPdf).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ code: '42' })]),
    )
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe(
      'booqi-jazz-en-madrid-42.pdf',
    )
  })

  it('reports a generation failure with an error toast, never an alert', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const renderPdf = vi.fn(async () => {
      throw new Error('pdf exploded')
    })
    withToasts(<DownloadTicketsButton bookings={[jazzBooking]} renderPdf={renderPdf} />)

    await userEvent.click(screen.getByRole('button', { name: 'Descargar entradas' }))

    expect(await screen.findByText('No se pudieron generar las entradas')).toBeInTheDocument()
    expect(alert).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Descargar entradas' })).toBeEnabled()
  })
})

describe('BookingQr', () => {
  it('shows the QR image of the booking', async () => {
    render(<BookingQr bookingId={42} />)

    const image = await screen.findByRole('img', { name: 'Código QR de la reserva 42' })
    expect(image).toHaveAttribute('src', expect.stringMatching(/^data:image\/png/))
  })

  it('keeps a busy placeholder while the QR is generated', () => {
    render(<BookingQr bookingId={42} generate={() => new Promise(() => {})} />)

    expect(screen.getByLabelText('Generando código QR')).toHaveAttribute('aria-busy', 'true')
  })
})
