import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { useSessionStore } from '../../features/auth/hooks/session-store'
import { useCartStore } from '../../features/cart/hooks/cart-store'
import { eventWith } from '../../test/fixtures/events'
import { useThemeStore } from '../../lib/theme-store'
import { userWith } from '../../test/users'
import { Providers } from '../providers'
import { AppLayout } from './AppLayout'

function renderShell(path = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <p>Inicio de prueba</p> },
          { path: '/events', element: <p>Eventos de prueba</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  )
  return router
}

function primaryNav() {
  return within(screen.getByRole('navigation', { name: 'Principal' }))
}

function hrefs(scope: ReturnType<typeof within>) {
  return scope.getAllByRole('link').map((link: HTMLElement) => link.getAttribute('href'))
}

beforeEach(() => {
  useCartStore.setState({ lines: [] })
  useSessionStore.setState({ user: null })
  localStorage.clear()
  document.documentElement.className = ''
  useThemeStore.setState({ theme: 'light' })
})

describe('AppLayout', () => {
  it('renders the header, navigation, main and footer landmarks', () => {
    renderShell()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('Inicio de prueba')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('makes the skip link the first focusable element and moves focus to main', async () => {
    const user = userEvent.setup()
    renderShell()

    await user.tab()
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute('href', '#main')

    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('always links to home, events and contact', () => {
    renderShell()

    expect(hrefs(primaryNav())).toEqual(expect.arrayContaining(['/', '/events', '/contact']))
  })

  it('shows login and register without a session and no logout', () => {
    renderShell()

    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(header.getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/register')
    expect(header.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
    expect(hrefs(primaryNav())).not.toContain('/my-bookings')
  })

  it('shows the customer links, name and logout, without admin', () => {
    useSessionStore.setState({ user: userWith('CUSTOMER', 'Mel') })
    renderShell()

    const header = within(screen.getByRole('banner'))
    expect(hrefs(primaryNav())).toEqual(expect.arrayContaining(['/my-bookings', '/profile']))
    expect(hrefs(primaryNav())).not.toContain('/admin')
    expect(header.getByText('Mel')).toBeInTheDocument()
    expect(header.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(header.queryByRole('link', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it('shows the admin link to an admin', () => {
    useSessionStore.setState({ user: userWith('ADMIN') })
    renderShell()

    expect(hrefs(primaryNav())).toContain('/admin')
  })

  it('logs out, clearing the session and going home', async () => {
    useSessionStore.getState().signIn(userWith('CUSTOMER'))
    const router = renderShell('/events')

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(useSessionStore.getState().user).toBeNull()
    expect(localStorage.getItem('booqi-session')).toBeNull()
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows a cart link with the number of tickets to a signed-in user', () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })
    useCartStore.setState({
      lines: [
        { event: eventWith({ id: 4 }), quantity: 2 },
        { event: eventWith({ id: 7 }), quantity: 3 },
      ],
    })
    renderShell()

    const cartLink = within(screen.getByRole('banner')).getByRole('link', { name: /carrito/i })
    expect(cartLink).toHaveAttribute('href', '/cart')
    expect(cartLink).toHaveAccessibleName(expect.stringContaining('5'))
  })

  it('shows the cart link with 0 tickets for an empty cart', () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })
    renderShell()

    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: /carrito/i }),
    ).toHaveAccessibleName(expect.stringContaining('0'))
  })

  it('shows no cart link without a session', () => {
    renderShell()

    expect(
      within(screen.getByRole('banner')).queryByRole('link', { name: /carrito/i }),
    ).not.toBeInTheDocument()
  })

  it('empties the cart on logout', async () => {
    useSessionStore.getState().signIn(userWith('CUSTOMER'))
    useCartStore.setState({ lines: [{ event: eventWith({ id: 4 }), quantity: 1 }] })
    const router = renderShell('/events')

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(useSessionStore.getState().user).toBeNull()
    expect(useCartStore.getState().lines).toEqual([])
    expect(router.state.location.pathname).toBe('/')
  })

  it('switches the theme with the toggle', async () => {
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Activar tema oscuro' }))

    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Activar tema claro' })).toBeInTheDocument()
  })

  it('opens a drawer with the same links from the mobile menu button', async () => {
    useSessionStore.setState({ user: userWith('ADMIN') })
    renderShell()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))

    const drawer = within(screen.getByRole('dialog', { name: 'Menú' }))
    expect(hrefs(drawer)).toEqual(expect.arrayContaining(hrefs(primaryNav())))
    expect(drawer.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('closes the drawer after following a link', async () => {
    renderShell()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))

    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Menú' })).getByRole('link', { name: 'Eventos' }),
    )

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('main')).toHaveTextContent('Eventos de prueba')
  })

  it('offers keyboard-reachable footer links', () => {
    renderShell()

    const footer = within(screen.getByRole('contentinfo'))
    expect(hrefs(footer)).toEqual(expect.arrayContaining(['/events', '/contact']))
  })

  describe('offline', () => {
    function goOffline(online: boolean) {
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
      window.dispatchEvent(new Event(online ? 'online' : 'offline'))
    }

    afterEach(() => {
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })
    })

    it('swaps the screen for the offline page and restores it when back online', () => {
      renderShell('/events')

      act(() => goOffline(false))
      expect(screen.getByRole('heading', { name: 'Sin conexión' })).toBeInTheDocument()
      expect(screen.getByRole('main')).not.toHaveTextContent('Eventos de prueba')
      expect(screen.getByRole('banner')).toBeInTheDocument()

      act(() => goOffline(true))
      expect(screen.queryByRole('heading', { name: 'Sin conexión' })).not.toBeInTheDocument()
      expect(screen.getByRole('main')).toHaveTextContent('Eventos de prueba')
    })

    it('retries by reading the connection state again', async () => {
      renderShell('/events')
      act(() => goOffline(false))
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true })

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(screen.getByRole('main')).toHaveTextContent('Eventos de prueba')
    })
  })
})
