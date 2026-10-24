import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi, type FakeApi } from '../../../test/fake-api'
import { bookingWith } from '../../../test/fixtures/bookings'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import type { BookingResponse } from '../../../types/booking'

const customer = { ...userWith('CUSTOMER'), id: 7 }
const confirmed = bookingWith({ id: 42, ticketQuantity: 2, totalPrice: 25, status: 'CONFIRMED' })
const cancelled = bookingWith({ id: 43, ticketQuantity: 1, totalPrice: 12.5, status: 'CANCELLED' })

function serve(bookings: BookingResponse[]) {
  const api = installFakeApi()
  const state = bookings.map((booking) => ({ ...booking }))
  api.get('/api/v1/bookings', { status: 200, data: state })
  api.patch(/^\/api\/v1\/bookings\/\d+\/cancel$/, (request) => {
    const booking = state.find((candidate) => request.path.includes(`/${candidate.id}/`))!
    booking.status = 'CANCELLED'
    return { status: 200, data: booking }
  })
  return api
}

function patches(api: FakeApi) {
  return api.requests.filter((request) => request.method === 'PATCH').map((request) => request.path)
}

function bookingRow(id: number) {
  return within(screen.getByRole('listitem', { name: `Reserva ${id}` }))
}

describe('MyBookingsPage', () => {
  it('requests the bookings of the session user', async () => {
    const api = serve([confirmed])
    renderApp('/my-bookings', { user: customer })

    await screen.findByRole('listitem', { name: 'Reserva 42' })
    expect(api.requests[0]!.url).toBe('/api/v1/bookings?userId=7')
  })

  it('shows a badge per booking and a group total without cancelled bookings', async () => {
    serve([confirmed, cancelled])
    renderApp('/my-bookings', { user: customer })

    const group = within(await screen.findByRole('article', { name: 'Jazz en Madrid' }))
    expect(bookingRow(42).getByText('Confirmada')).toBeInTheDocument()
    expect(bookingRow(43).getByText('Cancelada')).toBeInTheDocument()
    expect(group.getByTestId('group-total')).toHaveTextContent('2 entradas · 25,00 €')
    expect(group.getByTestId('group-status')).toHaveTextContent('Pendiente')
  })

  it('shows an empty state linking to the events', async () => {
    serve([])
    renderApp('/my-bookings', { user: customer })

    expect(
      await screen.findByRole('heading', { name: 'Todavía no tienes reservas' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar eventos' })).toHaveAttribute(
      'href',
      '/events',
    )
  })

  it('opens a detail drawer named after the event with code, QR and status', async () => {
    serve([confirmed])
    renderApp('/my-bookings', { user: customer })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ver detalle de la reserva 42' }),
    )

    const drawer = within(screen.getByRole('dialog', { name: 'Jazz en Madrid' }))
    expect(drawer.getByText('42')).toBeInTheDocument()
    expect(drawer.getByText('Confirmada')).toBeInTheDocument()
    expect(
      await drawer.findByRole('img', { name: 'Código QR de la reserva 42' }),
    ).toBeInTheDocument()
    expect(drawer.getByRole('button', { name: 'Descargar entradas' })).toBeEnabled()
  })

  it('cancels after confirming in the dialog and shows the new status', async () => {
    const confirm = vi.spyOn(window, 'confirm')
    const api = serve([bookingWith({ id: 42, status: 'PENDING' })])
    renderApp('/my-bookings', { user: customer })

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva 42' }))
    const dialog = within(screen.getByRole('dialog', { name: '¿Cancelar la reserva?' }))
    await userEvent.click(dialog.getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText('Reserva cancelada')).toBeInTheDocument()
    await waitFor(() => expect(bookingRow(42).getByText('Cancelada')).toBeInTheDocument())
    expect(patches(api)).toEqual(['/api/v1/bookings/42/cancel'])
    expect(confirm).not.toHaveBeenCalled()
  })

  it('sends nothing when the dialog is dismissed with Escape', async () => {
    const api = serve([confirmed])
    renderApp('/my-bookings', { user: customer })

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva 42' }))
    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(patches(api)).toEqual([])
    expect(bookingRow(42).getByText('Confirmada')).toBeInTheDocument()
  })

  it('offers no cancel or download for a cancelled booking', async () => {
    serve([cancelled])
    renderApp('/my-bookings', { user: customer })

    await screen.findByRole('listitem', { name: 'Reserva 43' })
    expect(screen.queryByRole('button', { name: 'Cancelar reserva 43' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /descargar/i })).not.toBeInTheDocument()
  })

  it('toasts a failed cancellation and closes the dialog', async () => {
    const api = serve([confirmed])
    api.patch('/api/v1/bookings/42/cancel', {
      status: 404,
      data: { detail: 'Booking with id 42 not found' },
    })
    renderApp('/my-bookings', { user: customer })

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva 42' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText('Booking with id 42 not found')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
