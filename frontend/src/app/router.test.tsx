import { render, screen, waitFor, within } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { useSessionStore } from '../features/auth/hooks/session-store'
import { userWith } from '../test/users'
import { Providers } from './providers'
import { routes } from './router'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
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
})

describe('routes', () => {
  it.each([
    ['/', 'Inicio · Booqi'],
    ['/events', 'Eventos · Booqi'],
    ['/events/42', 'Detalle del evento · Booqi'],
    ['/cart', 'Carrito · Booqi'],
    ['/login', 'Iniciar sesión · Booqi'],
    ['/register', 'Crear cuenta · Booqi'],
    ['/contact', 'Contacto · Booqi'],
  ])('%s renders inside the layout titled %s', async (path, title) => {
    renderAt(path)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe(title))
    expect(description().trim()).not.toBe('')
  })

  it.each([
    ['/checkout', 'Pago · Booqi'],
    ['/my-bookings', 'Mis reservas · Booqi'],
    ['/profile', 'Mi perfil · Booqi'],
  ])('%s needs a session and is titled %s', async (path, title) => {
    const router = renderAt(path)
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(`?redirect=${encodeURIComponent(path)}`)

    useSessionStore.setState({ user: userWith('CUSTOMER') })
    await router.navigate(path)

    expect(router.state.location.pathname).toBe(path)
    await waitFor(() => expect(document.title).toBe(title))
  })

  it('/admin needs the ADMIN role', async () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })
    const router = renderAt('/admin')

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()

    useSessionStore.setState({ user: userWith('ADMIN') })
    await router.navigate('/events')
    await router.navigate('/admin')

    await waitFor(() => expect(document.title).toBe('Administración · Booqi'))
  })

  it('/admin without a session redirects to login', () => {
    const router = renderAt('/admin')

    expect(router.state.location.search).toBe('?redirect=%2Fadmin')
  })

  it('renders the not-found page with a link home for unknown paths', async () => {
    renderAt('/does-not-exist')

    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(main.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Página no encontrada · Booqi'))
  })

  it('shows a "Próximamente" placeholder for screens not built yet', () => {
    renderAt('/events')

    expect(screen.getByRole('heading', { name: 'Próximamente' })).toBeInTheDocument()
  })

  it('decorates the home page with the brand backdrop', () => {
    renderAt('/')

    expect(screen.getByTestId('brand-backdrop')).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not decorate other pages with the backdrop', () => {
    renderAt('/contact')

    expect(screen.queryByTestId('brand-backdrop')).not.toBeInTheDocument()
  })
})
