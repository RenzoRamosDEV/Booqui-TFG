import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi } from '../../../test/fake-api'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    Nombre: 'Mel',
    Apellidos: 'García',
    'Fecha de nacimiento': '2000-01-01',
    Email: 'mel@booqi.com',
    'Teléfono (opcional)': '',
    Contraseña: 'secreto12',
    'Repite la contraseña': 'secreto12',
    ...overrides,
  }
  await screen.findByLabelText('Nombre')
  for (const [label, value] of Object.entries(values)) {
    if (value) await userEvent.type(screen.getByLabelText(label), value)
  }
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

describe('RegisterPage', () => {
  it('blocks a 7-character password without sending anything', async () => {
    const api = installFakeApi()
    renderApp('/register')

    await fillForm({ Contraseña: 'abc1234', 'Repite la contraseña': 'abc1234' })

    expect(
      await screen.findByText('La contraseña debe tener al menos 8 caracteres'),
    ).toBeInTheDocument()
    expect(api.requests).toEqual([])
  })

  it('registers a CUSTOMER, toasts and goes to login keeping the redirect', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users', { status: 201, data: userWith('CUSTOMER') })
    const { router } = renderApp('/register?redirect=%2Fcart')

    await fillForm({ 'Teléfono (opcional)': '+34600111222' })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?redirect=%2Fcart')
    expect(await screen.findByText('Cuenta creada')).toBeInTheDocument()
    expect(api.requests[0]!.body).toStrictEqual({
      firstName: 'Mel',
      lastName: 'García',
      dateOfBirth: '2000-01-01',
      contactPhone: '+34600111222',
      contactEmail: 'mel@booqi.com',
      password: 'secreto12',
      role: 'CUSTOMER',
    })
  })

  it('shows a 409 under the email field', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users', {
      status: 409,
      data: { detail: 'User with contactEmail mel@booqi.com already exists' },
    })
    renderApp('/register')

    await fillForm()

    expect(await screen.findByText('Este email ya está registrado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a server field error under its field', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users', {
      status: 400,
      data: {
        detail: 'Validation failed',
        errors: [
          { field: 'dateOfBirth', message: 'La fecha de nacimiento debe ser una fecha pasada' },
        ],
      },
    })
    renderApp('/register')

    await fillForm()

    expect(
      await screen.findByText('La fecha de nacimiento debe ser una fecha pasada'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows other failures as the ApiError message', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users', { status: 503 })
    renderApp('/register')

    await fillForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El servicio no está disponible. Inténtalo más tarde.',
    )
  })
})
