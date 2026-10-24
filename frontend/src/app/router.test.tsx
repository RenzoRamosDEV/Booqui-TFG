import { render, screen, waitFor, within } from '@testing-library/react'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router'
import { useSessionStore } from '../features/auth/hooks/session-store'
import { installFakeApi } from '../test/fake-api'
import { eventWith } from '../test/fixtures/events'
import { userWith } from '../test/users'
import { Providers } from './providers'
import { routes } from './router'

function renderAt(path: string, routeList: RouteObject[] = routes) {
  const router = createMemoryRouter(routeList, { initialEntries: [path] })
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  )
  return router
}

function description() {
  return document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
}

beforeEach(() => {
  useSessionStore.setState({ user: null })
  localStorage.clear()
  const api = installFakeApi()
  api.get('/api/v1/events', { status: 200, data: [] })
  api.get('/api/v1/events/42', {
    status: 200,
    data: eventWith({ id: 42, title: 'Jazz en Madrid' }),
  })
})

describe('routes', () => {
  it.each([
    ['/', 'Inicio · Booqi'],
    ['/events', 'Eventos · Booqi'],
    ['/events/42', 'Jazz en Madrid · Booqi'],
    ['/cart', 'Carrito · Booqi'],
    ['/login', 'Iniciar sesión · Booqi'],
    ['/register', 'Crear cuenta · Booqi'],
    ['/contact', 'Contacto · Booqi'],
  ])('%s renders inside the layout titled %s', async (path, title) => {
    renderAt(path)

    const heading = await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('main')).toContainElement(heading)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe(title))
    expect(description().trim()).not.toBe('')
  })

  it.each([
    ['/checkout', 'Pago · Booqi'],
    ['/my-bookings', 'Mis reservas · Booqi'],
    ['/profile', 'Mi perfil · Booqi'],
  ])('%s needs a session and is titled %s', async (path, title) => {
    const router = renderAt(path)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe(`?redirect=${encodeURIComponent(path)}`)

    useSessionStore.setState({ user: userWith('CUSTOMER') })
    await router.navigate(path)

    expect(router.state.location.pathname).toBe(path)
    await waitFor(() => expect(document.title).toBe(title))
  })

  it('/admin needs the ADMIN role', async () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })
    const router = renderAt('/admin')

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()

    useSessionStore.setState({ user: userWith('ADMIN') })
    await router.navigate('/events')
    await router.navigate('/admin')

    await waitFor(() => expect(document.title).toBe('Administración · Booqi'))
  })

  it('/admin without a session redirects to login', async () => {
    const router = renderAt('/admin')

    await waitFor(() => expect(router.state.location.search).toBe('?redirect=%2Fadmin'))
  })

  it('renders the not-found page with a link home for unknown paths', async () => {
    renderAt('/does-not-exist')

    await screen.findByRole('heading', { name: 'Página no encontrada' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(main.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Página no encontrada · Booqi'))
  })

  it('shows a "Próximamente" placeholder for screens not built yet', async () => {
    renderAt('/cart')

    expect(await screen.findByRole('heading', { name: 'Próximamente' })).toBeInTheDocument()
  })

  it('decorates the home page with the brand backdrop', async () => {
    renderAt('/')

    expect(await screen.findByTestId('brand-backdrop')).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not decorate other pages with the backdrop', async () => {
    renderAt('/contact')

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByTestId('brand-backdrop')).not.toBeInTheDocument()
  })
})

function pageRoutes(list: RouteObject[]): RouteObject[] {
  return list.flatMap((route) => [
    ...(route.path ? [route] : []),
    ...pageRoutes(route.children ?? []),
  ])
}

function withExtraPage(page: RouteObject): RouteObject[] {
  return routes.map((layout) => ({
    ...layout,
    children: layout.children?.map((child) =>
      child.id === 'pages' ? { ...child, children: [...(child.children ?? []), page] } : child,
    ),
  })) as RouteObject[]
}

describe('route loading', () => {
  it('loads every page on demand instead of eagerly', () => {
    const pages = pageRoutes(routes)

    expect(pages.map((route) => route.path)).toEqual(
      expect.arrayContaining(['/', '/events', '/admin', '/my-bookings', '*']),
    )
    for (const route of pages) {
      expect(route.lazy, route.path).toBeTypeOf('function')
      expect(route.element, route.path).toBeUndefined()
      expect(route.Component, route.path).toBeUndefined()
    }
  })

  it('resolves each lazy page to a component', async () => {
    for (const route of pageRoutes(routes)) {
      const load = route.lazy as () => Promise<RouteObject>
      expect((await load()).Component, route.path).toBeTypeOf('function')
    }
  })
})

describe('route error boundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  function Boom(): never {
    throw new Error('Kaboom at stack frame')
  }

  it('shows the error page inside the layout when a screen throws', async () => {
    renderAt('/boom', withExtraPage({ path: '/boom', Component: Boom }))

    await screen.findByRole('heading', { name: 'Algo ha salido mal' })
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Algo ha salido mal' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(main.getByRole('button', { name: 'Recargar' })).toBeInTheDocument()
    expect(main.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
    expect(document.body).not.toHaveTextContent('Kaboom')
    await waitFor(() => expect(document.title).toBe('Algo ha salido mal · Booqi'))
  })

  it('shows the error page when the code of a route fails to load', async () => {
    renderAt(
      '/chunk',
      withExtraPage({
        path: '/chunk',
        lazy: () => Promise.reject(new Error('Failed to fetch dynamically imported module')),
      }),
    )

    expect(await screen.findByRole('heading', { name: 'Algo ha salido mal' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('dynamically imported')
  })
})
