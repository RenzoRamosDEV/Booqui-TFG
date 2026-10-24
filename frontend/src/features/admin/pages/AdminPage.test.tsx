import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi, type FakeApi } from '../../../test/fake-api'
import { bookingWith } from '../../../test/fixtures/bookings'
import { eventWith } from '../../../test/fixtures/events'
import { paymentWith } from '../../../test/fixtures/payments'
import { renderWithProviders } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import type { EventResponse } from '../../../types/event'
import type { UserResponse } from '../../../types/user'
import { useSessionStore } from '../../auth/hooks/session-store'
import { ReportRendererContext } from '../report/report-renderer'
import { AdminPage } from './AdminPage'

const admin: UserResponse = { ...userWith('ADMIN', 'Mel'), id: 1 }
const ana: UserResponse = {
  ...userWith('CUSTOMER', 'Ana'),
  id: 9,
  lastName: 'López',
  contactEmail: 'ana@booqi.com',
}
const leo: UserResponse = {
  ...userWith('CUSTOMER', 'Leo'),
  id: 10,
  lastName: 'Ruiz',
  contactEmail: 'leo@booqi.com',
}
const jazz = eventWith({ id: 4, title: 'Jazz en Madrid', price: 12.5 })
const rock = eventWith({
  id: 7,
  title: 'Rock en Madrid',
  price: 30,
  contactEmail: 'rock@booqi.com',
})

type Backend = { api: FakeApi; users: UserResponse[]; events: EventResponse[] }

function backend({ payments = [] as ReturnType<typeof paymentWith>[] } = {}): Backend {
  const api = installFakeApi()
  const users = [admin, ana, leo]
  const events = [jazz, rock].map((event) => ({ ...event }))
  api.get('/api/v1/users', () => ({ status: 200, data: users }))
  api.delete(/^\/api\/v1\/users\/\d+$/, (request) => {
    const id = Number(request.path.split('/').at(-1))
    users.splice(
      users.findIndex((user) => user.id === id),
      1,
    )
    return { status: 204 }
  })
  api.get('/api/v1/events', () => ({ status: 200, data: events }))
  api.put(/^\/api\/v1\/events\/\d+$/, (request) => {
    const event = events.find((candidate) => request.path.endsWith(`/${candidate.id}`))!
    Object.assign(event, request.body)
    return { status: 200, data: event }
  })
  api.get('/api/v1/payments', { status: 200, data: payments })
  api.get('/api/v1/bookings', {
    status: 200,
    data: [
      bookingWith({ id: 42, eventId: 4 }),
      bookingWith({ id: 43, eventId: 7, eventTitle: 'Rock en Madrid' }),
    ],
  })
  return { api, users, events }
}

const fakePdf = vi.fn(async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' }))

function renderAdmin() {
  useSessionStore.setState({ user: admin })
  return renderWithProviders(
    <ReportRendererContext.Provider value={fakePdf}>
      <AdminPage />
    </ReportRendererContext.Provider>,
    '/admin',
  )
}

async function openTab(name: string) {
  await userEvent.click(await screen.findByRole('tab', { name }))
}

function writes(api: FakeApi) {
  return api.requests
    .filter((request) => request.method !== 'GET')
    .map((request) => `${request.method} ${request.path}`)
}

beforeEach(() => {
  fakePdf.mockClear()
  URL.createObjectURL = vi.fn(() => 'blob:booqi/report')
  URL.revokeObjectURL = vi.fn()
})

describe('AdminPage', () => {
  it('offers the Usuarios, Eventos and Ventas tabs', async () => {
    backend()
    renderAdmin()

    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Usuarios', 'Eventos', 'Ventas'])
  })

  it('summarises admins, customers, average price and approved sales', async () => {
    backend({ payments: [paymentWith({ id: 1, totalPrice: 25, status: 'APPROVED' })] })
    renderAdmin()

    await waitFor(() => expect(screen.getByTestId('summary-admins')).toHaveTextContent('1'))
    expect(screen.getByTestId('summary-customers')).toHaveTextContent('2')
    expect(screen.getByTestId('summary-average')).toHaveTextContent('21,25')
    expect(screen.getByTestId('summary-approved')).toHaveTextContent('25,00')
  })

  describe('users', () => {
    it('lists the users and offers no delete for the own account', async () => {
      backend()
      renderAdmin()

      const table = within(await screen.findByRole('table', { name: 'Usuarios' }))
      expect(await table.findByText('ana@booqi.com')).toBeInTheDocument()
      expect(table.getAllByText('Cliente')).toHaveLength(2)
      expect(table.getByText('Administrador')).toBeInTheDocument()
      expect(table.queryByRole('button', { name: 'Eliminar a Mel García' })).not.toBeInTheDocument()
      expect(table.getByRole('button', { name: 'Eliminar a Ana López' })).toBeInTheDocument()
    })

    it('deletes user 9 after confirming', async () => {
      const { api } = backend()
      renderAdmin()

      await userEvent.click(await screen.findByRole('button', { name: 'Eliminar a Ana López' }))
      await userEvent.click(
        within(screen.getByRole('dialog', { name: '¿Eliminar usuario?' })).getByRole('button', {
          name: 'Eliminar',
        }),
      )

      await waitFor(() => expect(screen.queryByText('ana@booqi.com')).not.toBeInTheDocument())
      expect(writes(api)).toEqual(['DELETE /api/v1/users/9'])
      expect(await screen.findByText('Usuario eliminado')).toBeInTheDocument()
    })
  })

  describe('events', () => {
    async function openCreate() {
      await openTab('Eventos')
      await userEvent.click(await screen.findByRole('button', { name: 'Nuevo evento' }))
      return within(screen.getByRole('dialog', { name: 'Nuevo evento' }))
    }

    async function fillValid(dialog: ReturnType<typeof within>, endDate = '2099-01-01T23:00') {
      await userEvent.type(dialog.getByLabelText('Título'), 'Concierto nuevo')
      await userEvent.type(dialog.getByLabelText('Entradas disponibles'), '100')
      await userEvent.type(dialog.getByLabelText('Precio (€)'), '20')
      await userEvent.type(dialog.getByLabelText('Ubicación'), 'Teatro Real, Madrid')
      await userEvent.type(dialog.getByLabelText('Inicio'), '2099-01-01T20:00')
      await userEvent.type(dialog.getByLabelText('Fin'), endDate)
      await userEvent.type(dialog.getByLabelText('Organizador'), 'Booqi Live')
      await userEvent.selectOptions(dialog.getByLabelText('Categoría'), 'Música')
      await userEvent.type(dialog.getByLabelText('Email de contacto'), 'nuevo@booqi.com')
      await userEvent.type(dialog.getByLabelText('Teléfono de contacto'), '+34600111222')
    }

    it('blocks an end date before the start without sending anything', async () => {
      const { api } = backend()
      renderAdmin()

      const dialog = await openCreate()
      await fillValid(dialog, '2099-01-01T19:00')
      await userEvent.click(dialog.getByRole('button', { name: 'Crear evento' }))

      expect(
        await dialog.findByText('La fecha de fin no puede ser anterior a la de inicio'),
      ).toBeInTheDocument()
      expect(writes(api)).toEqual([])
    })

    it('shows a 409 detail in the dialog, which stays open', async () => {
      const { api } = backend()
      api.post('/api/v1/events', {
        status: 409,
        data: { detail: 'Event with contactEmail a@b.com already exists' },
      })
      renderAdmin()

      const dialog = await openCreate()
      await fillValid(dialog)
      await userEvent.click(dialog.getByRole('button', { name: 'Crear evento' }))

      expect(await dialog.findByRole('alert')).toHaveTextContent(
        'Event with contactEmail a@b.com already exists',
      )
      expect(screen.getByRole('dialog', { name: 'Nuevo evento' })).toBeInTheDocument()
    })

    it('shows a server field error under its field', async () => {
      const { api } = backend()
      api.post('/api/v1/events', {
        status: 400,
        data: {
          detail: 'Validation failed',
          errors: [{ field: 'startDate', message: 'La fecha de inicio debe ser en el futuro' }],
        },
      })
      renderAdmin()

      const dialog = await openCreate()
      await fillValid(dialog)
      await userEvent.click(dialog.getByRole('button', { name: 'Crear evento' }))

      expect(
        await dialog.findByText('La fecha de inicio debe ser en el futuro'),
      ).toBeInTheDocument()
      expect(dialog.getByLabelText('Inicio')).toHaveAttribute('aria-invalid', 'true')
    })

    it('creates an event and closes the dialog', async () => {
      const { api } = backend()
      api.post('/api/v1/events', {
        status: 201,
        data: eventWith({ id: 99, title: 'Concierto nuevo' }),
      })
      renderAdmin()

      const dialog = await openCreate()
      await fillValid(dialog)
      await userEvent.click(dialog.getByRole('button', { name: 'Crear evento' }))

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(api.requestsTo('POST', '/api/v1/events')[0]!.body).toMatchObject({
        title: 'Concierto nuevo',
        availableTickets: 100,
        price: 20,
        startDate: '2099-01-01T20:00:00',
        endDate: '2099-01-01T23:00:00',
      })
    })

    it('edits only the price', async () => {
      const { api } = backend()
      renderAdmin()
      await openTab('Eventos')

      await userEvent.click(await screen.findByRole('button', { name: 'Editar Jazz en Madrid' }))
      const dialog = within(screen.getByRole('dialog', { name: 'Editar evento' }))
      await userEvent.clear(dialog.getByLabelText('Precio (€)'))
      await userEvent.type(dialog.getByLabelText('Precio (€)'), '25')
      await userEvent.click(dialog.getByRole('button', { name: 'Guardar cambios' }))

      await waitFor(() => expect(api.requestsTo('PUT', '/api/v1/events/4')).toHaveLength(1))
      expect(api.requestsTo('PUT', '/api/v1/events/4')[0]!.body).toStrictEqual({ price: 25 })
      const row = within(await screen.findByRole('row', { name: /Jazz en Madrid/ }))
      expect(
        await row.findByText('25,00 €', { normalizer: (text) => text.replace(/\s/g, ' ') }),
      ).toBeInTheDocument()
    })

    it('sends nothing when the delete dialog is cancelled', async () => {
      const { api } = backend()
      renderAdmin()
      await openTab('Eventos')

      await userEvent.click(await screen.findByRole('button', { name: 'Eliminar Jazz en Madrid' }))
      await userEvent.click(
        within(screen.getByRole('dialog', { name: '¿Eliminar evento?' })).getByRole('button', {
          name: 'Cancelar',
        }),
      )

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(writes(api)).toEqual([])
    })
  })

  describe('sales', () => {
    const payments = [
      paymentWith({ id: 1, bookingId: 42, eventId: 4, totalPrice: 25, status: 'APPROVED' }),
      paymentWith({ id: 2, bookingId: 42, eventId: 4, totalPrice: 12.5, status: 'APPROVED' }),
      paymentWith({ id: 3, bookingId: 43, eventId: 7, totalPrice: 30, status: 'APPROVED' }),
      paymentWith({
        id: 4,
        bookingId: 43,
        eventId: 7,
        totalPrice: 60,
        status: 'REJECTED',
        paymentMethod: 'PAYPAL',
      }),
    ]

    function salesRows() {
      return within(screen.getByRole('table', { name: 'Ventas' }))
        .getAllByRole('row')
        .slice(1)
    }

    it('filters the rejected payments and totals them', async () => {
      backend({ payments })
      renderAdmin()
      await openTab('Ventas')
      await waitFor(() => expect(salesRows()).toHaveLength(4))

      await userEvent.selectOptions(screen.getByLabelText('Estado del pago'), 'REJECTED')

      expect(salesRows()).toHaveLength(1)
      expect(screen.getByTestId('total-rejected')).toHaveTextContent('60,00')
      expect(screen.getByTestId('total-approved')).toHaveTextContent('0,00')
    })

    it('filters by event', async () => {
      backend({ payments })
      renderAdmin()
      await openTab('Ventas')
      await waitFor(() => expect(salesRows()).toHaveLength(4))

      await userEvent.selectOptions(screen.getByLabelText('Evento'), '7')

      expect(salesRows()).toHaveLength(2)
      expect(screen.getByTestId('total-approved')).toHaveTextContent('30,00')
    })

    it('warns instead of producing a PDF when there are no sales', async () => {
      const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
      backend()
      renderAdmin()
      await openTab('Ventas')

      await userEvent.click(await screen.findByRole('button', { name: 'Vista previa del informe' }))

      expect(await screen.findByText('No hay ventas que exportar')).toBeInTheDocument()
      expect(fakePdf).not.toHaveBeenCalled()
      expect(alert).not.toHaveBeenCalled()
    })

    it('previews the event report in a dialog and revokes its URL on close', async () => {
      backend({ payments })
      renderAdmin()
      await openTab('Ventas')
      await waitFor(() => expect(salesRows()).toHaveLength(4))
      await userEvent.selectOptions(screen.getByLabelText('Evento'), '4')

      await userEvent.click(screen.getByRole('button', { name: 'Vista previa del informe' }))

      const dialog = within(await screen.findByRole('dialog', { name: 'Vista previa del informe' }))
      expect(dialog.getByTitle('Vista previa del informe')).toHaveAttribute(
        'src',
        'blob:booqi/report',
      )
      expect(fakePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Informe de ventas · Jazz en Madrid',
          exportedBy: 'Exportado por Mel García',
        }),
      )
      expect(dialog.getByRole('button', { name: 'Descargar' })).toBeInTheDocument()

      await userEvent.click(dialog.getByRole('button', { name: 'Cerrar' }))

      await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:booqi/report'))
    })
  })
})
