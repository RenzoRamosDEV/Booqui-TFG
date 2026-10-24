import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi } from '../../../test/fake-api'
import { eventWith } from '../../../test/fixtures/events'
import { renderApp, searchParam } from '../../../test/render-app'

const future = (day: number) => `2099-01-${String(day).padStart(2, '0')}T20:00:00`

describe('HomePage', () => {
  it('searches from the hero', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [] })
    const { router } = renderApp('/')

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar eventos' }), 'jazz')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/events'))
    expect(router.state.location.search).toBe('?q=jazz')
  })

  it('shows exactly the events the backend returns', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', {
      status: 200,
      data: [
        eventWith({ id: 1, title: 'Jazz en Madrid', startDate: future(1) }),
        eventWith({ id: 2, title: 'Rock en Sevilla', startDate: future(2) }),
      ],
    })
    renderApp('/')

    expect(await screen.findByRole('link', { name: 'Jazz en Madrid' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rock en Sevilla' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('shows the error message and no cards when the backend fails', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 503 })
    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El servicio no está disponible. Inténtalo más tarde.',
    )
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('shows skeletons while loading', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', () => new Promise(() => {}))
    renderApp('/')

    expect(await screen.findByRole('region', { name: 'Cargando eventos' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('shows an empty state without upcoming events', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [] })
    renderApp('/')

    expect(
      await screen.findByRole('heading', { name: 'Todavía no hay eventos próximos' }),
    ).toBeInTheDocument()
  })

  it('opens the listing filtered by a category shortcut', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [] })
    const { router } = renderApp('/')

    const shortcuts = within(await screen.findByRole('navigation', { name: 'Categorías' }))
    await userEvent.click(shortcuts.getByRole('link', { name: 'Música' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/events'))
    expect(searchParam(router, 'category')).toBe('Música')
  })

  it('decorates the hero with the brand backdrop and titles the page', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [] })
    renderApp('/')

    expect(await screen.findByTestId('brand-backdrop')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Inicio · Booqi'))
  })
})
