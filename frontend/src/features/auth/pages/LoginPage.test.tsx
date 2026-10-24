import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi } from '../../../test/fake-api'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import { useSessionStore } from '../hooks/session-store'

async function fillAndSubmit(email: string, password: string) {
  if (email) await userEvent.type(await screen.findByLabelText('Email'), email)
  if (password) await userEvent.type(screen.getByLabelText('Contraseña'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

describe('LoginPage', () => {
  it('shows the Spanish message on 401 and stores no session', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', {
      status: 401,
      data: { status: 401, detail: 'Invalid email or password' },
    })
    renderApp('/login')

    await fillAndSubmit('mel@booqi.com', 'malamente')

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.')
    expect(useSessionStore.getState().user).toBeNull()
  })

  it('stores the session and honours the redirect', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', { status: 200, data: userWith('CUSTOMER') })
    const { router } = renderApp('/login?redirect=%2Fcheckout')

    await fillAndSubmit('mel@booqi.com', 'secreto123')

    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
    expect(useSessionStore.getState().user).toEqual(userWith('CUSTOMER'))
    expect(api.requests[0]!.body).toStrictEqual({
      contactEmail: 'mel@booqi.com',
      password: 'secreto123',
    })
  })

  it('sends an admin without redirect to /admin', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', { status: 200, data: userWith('ADMIN') })
    api.get('/api/v1/users', { status: 200, data: [] })
    const { router } = renderApp('/login')

    await fillAndSubmit('admin@booqi.com', 'secreto123')

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
  })

  it('shows field errors and sends nothing when the password is empty', async () => {
    const api = installFakeApi()
    renderApp('/login')

    await fillAndSubmit('mel@booqi.com', '')

    expect(await screen.findByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true')
    expect(api.requests).toEqual([])
  })

  it('validates the email format before sending', async () => {
    const api = installFakeApi()
    renderApp('/login')

    await fillAndSubmit('mel', 'secreto123')

    expect(await screen.findByText('El email debe ser válido')).toBeInTheDocument()
    expect(api.requests).toEqual([])
  })

  it('shows other failures with the ApiError message', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', 'network-error')
    renderApp('/login')

    await fillAndSubmit('mel@booqi.com', 'secreto123')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor.',
    )
  })

  it('links to registration keeping the redirect', async () => {
    installFakeApi()
    renderApp('/login?redirect=%2Fcart')

    expect(await screen.findByRole('link', { name: 'Crea una cuenta' })).toHaveAttribute(
      'href',
      '/register?redirect=%2Fcart',
    )
    await waitFor(() => expect(document.title).toBe('Iniciar sesión · Booqi'))
  })
})
