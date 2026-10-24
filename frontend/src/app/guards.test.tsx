import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { useSessionStore } from '../features/auth/hooks/session-store'
import type { Role, UserResponse } from '../types/user'
import { RequireAuth } from './guards'

function userWith(role: Role): UserResponse {
  return {
    id: 1,
    firstName: 'Mel',
    lastName: 'García',
    dateOfBirth: '2000-01-01',
    contactPhone: null,
    contactEmail: 'mel@booqi.com',
    role,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  }
}

const adminMounted = vi.fn()

function AdminSpy() {
  adminMounted()
  return <p>Panel de administración</p>
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <p>Login</p> },
      {
        element: <RequireAuth requirement="auth" />,
        children: [{ path: '/my-bookings', element: <p>Mis reservas</p> }],
      },
      {
        element: <RequireAuth requirement="admin" />,
        children: [{ path: '/admin', element: <AdminSpy /> }],
      },
    ],
    { initialEntries: [path] },
  )
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  useSessionStore.setState({ user: null })
  adminMounted.mockClear()
})

describe('RequireAuth', () => {
  it('redirects to login with the requested path when there is no session', () => {
    const router = renderAt('/my-bookings')

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?redirect=%2Fmy-bookings')
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('Mis reservas')).not.toBeInTheDocument()
  })

  it('keeps the query string in the redirect', () => {
    const router = renderAt('/my-bookings?page=2')

    expect(router.state.location.search).toBe('?redirect=%2Fmy-bookings%3Fpage%3D2')
  })

  it('redirects an anonymous visitor away from admin routes too', () => {
    const router = renderAt('/admin')

    expect(router.state.location.pathname).toBe('/login')
    expect(adminMounted).not.toHaveBeenCalled()
  })

  it('renders an authenticated route for a customer', () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })

    renderAt('/my-bookings')

    expect(screen.getByText('Mis reservas')).toBeInTheDocument()
  })

  it('shows the not-found page to a customer on /admin without mounting admin content', () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })

    const router = renderAt('/admin')

    expect(router.state.location.pathname).toBe('/admin')
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /inicio/i })).toHaveAttribute('href', '/')
    expect(adminMounted).not.toHaveBeenCalled()
  })

  it('renders the admin route for an admin', () => {
    useSessionStore.setState({ user: userWith('ADMIN') })

    renderAt('/admin')

    expect(screen.getByText('Panel de administración')).toBeInTheDocument()
    expect(adminMounted).toHaveBeenCalled()
  })
})
