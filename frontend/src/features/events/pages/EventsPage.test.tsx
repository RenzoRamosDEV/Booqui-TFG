import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCartStore } from '../../cart/hooks/cart-store'
import { installFakeApi } from '../../../test/fake-api'
import { eventWith } from '../../../test/fixtures/events'
import { renderApp, searchParam } from '../../../test/render-app'
import { userWith } from '../../../test/users'

function manyEvents(count: number) {
  return Array.from({ length: count }, (_, index) =>
    eventWith({
      id: index + 1,
      title: `Evento ${index + 1}`,
      startDate: `2099-01-${String(index + 1).padStart(2, '0')}T20:00:00`,
    }),
  )
}

const jazz = eventWith({
  id: 1,
  title: 'Jazz en Madrid',
  category: 'Música',
  location: 'IFEMA, Madrid',
  price: 20,
  startDate: '2099-01-01T20:00:00',
})
const rock = eventWith({
  id: 2,
  title: 'Rock en Madrid',
  category: 'Música',
  location: 'WiZink, Madrid',
  price: 45,
  startDate: '2099-01-02T20:00:00',
})

function cardTitles() {
  return screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent)
}

describe('EventsPage', () => {
  it('requests the events once without query string and filters from the URL', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazz, rock] })
    renderApp('/events?category=M%C3%BAsica&city=madrid&maxPrice=30')

    expect(await screen.findByRole('link', { name: 'Jazz en Madrid' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Rock en Madrid' })).not.toBeInTheDocument()
    expect(api.requests.map((request) => request.url)).toEqual(['/api/v1/events'])
  })

  it('fills the filter controls from the URL', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazz] })
    renderApp('/events?q=jazz&category=M%C3%BAsica')

    expect(await screen.findByRole('searchbox', { name: 'Buscar' })).toHaveValue('jazz')
    expect(screen.getByRole('combobox', { name: 'Categoría' })).toHaveValue('Música')
  })

  it('shows 12 events per page and marks the current page', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: manyEvents(30) })
    renderApp('/events?page=2')

    await screen.findByRole('link', { name: 'Evento 13' })
    expect(cardTitles()).toEqual(
      manyEvents(24)
        .slice(12)
        .map((event) => event.title),
    )
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('clamps an out-of-range page to the last one', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: manyEvents(30) })
    renderApp('/events?page=9')

    expect(await screen.findByRole('link', { name: 'Evento 25' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('moves to another page keeping the filters', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: manyEvents(30) })
    const { router } = renderApp('/events?q=evento')

    await userEvent.click(await screen.findByRole('button', { name: 'Página 2' }))

    expect(router.state.location.search).toBe('?q=evento&page=2')
  })

  it('resets the page when a filter changes', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: manyEvents(30) })
    const { router } = renderApp('/events?page=2')

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Categoría' }),
      'Arte',
    )

    expect(router.state.location.search).toBe(`?category=Arte`)
  })

  it('applies the text search on submit', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazz, rock] })
    const { router } = renderApp('/events')

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar' }), 'rock{Enter}')

    expect(searchParam(router, 'q')).toBe('rock')
    await waitFor(() => expect(cardTitles()).toEqual(['Rock en Madrid']))
  })

  it('offers to clear the filters when nothing matches', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazz] })
    const { router } = renderApp('/events?q=zzz')

    expect(
      await screen.findByRole('heading', { name: 'Ningún evento coincide con tu búsqueda' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(router.state.location.pathname).toBe('/events')
    expect(router.state.location.search).toBe('')
    expect(await screen.findByRole('link', { name: 'Jazz en Madrid' })).toBeInTheDocument()
  })

  it('shows the offline state when the request fails without response', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', 'network-error')
    renderApp('/events')

    expect(await screen.findByRole('heading', { name: 'Sin conexión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('sends an anonymous visitor to login when adding from the listing', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazz] })
    const { router } = renderApp('/events?q=jazz')

    await userEvent.click(
      await screen.findByRole('button', { name: 'Añadir Jazz en Madrid al carrito' }),
    )

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(searchParam(router, 'redirect')).toBe('/events?q=jazz')
    expect(useCartStore.getState().lines).toEqual([])
  })

  it('adds one ticket from the listing with a session', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazz] })
    renderApp('/events', { user: userWith('CUSTOMER') })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Añadir Jazz en Madrid al carrito' }),
    )

    expect(useCartStore.getState().lines).toEqual([{ event: jazz, quantity: 1 }])
    expect(await screen.findByText('Añadido al carrito')).toBeInTheDocument()
  })

  it('disables adding a sold-out event', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [{ ...jazz, availableTickets: 0 }] })
    renderApp('/events')

    expect(
      await screen.findByRole('button', { name: 'Añadir Jazz en Madrid al carrito' }),
    ).toBeDisabled()
  })
})
