import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi } from '../../../test/fake-api'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import { useSessionStore } from '../hooks/session-store'

const customer = userWith('CUSTOMER')

describe('ProfilePage', () => {
  it('prefills the form with the session user and shows the role read-only', async () => {
    installFakeApi()
    renderApp('/profile', { user: customer })

    expect(await screen.findByLabelText('Nombre')).toHaveValue('Mel')
    expect(screen.getByLabelText('Apellidos')).toHaveValue('García')
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveValue('2000-01-01')
    expect(screen.getByLabelText('Email')).toHaveValue('mel@booqi.com')
    expect(screen.getByLabelText('Teléfono (opcional)')).toHaveValue('')
    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.queryByLabelText(/rol/i)).not.toBeInTheDocument()
  })

  it('sends only the changed phone and updates the session', async () => {
    const api = installFakeApi()
    const updated = { ...customer, contactPhone: '+34600111222' }
    api.put('/api/v1/users/1', { status: 200, data: updated })
    renderApp('/profile', { user: customer })

    await userEvent.type(await screen.findByLabelText('Teléfono (opcional)'), '+34600111222')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Perfil actualizado')).toBeInTheDocument()
    expect(api.requests[0]!.body).toStrictEqual({ contactPhone: '+34600111222' })
    expect(useSessionStore.getState().user).toEqual(updated)
    expect(within(screen.getByRole('banner')).getByText('Mel')).toBeInTheDocument()
  })

  it('shows a 409 under the email and keeps the session', async () => {
    const api = installFakeApi()
    api.put('/api/v1/users/1', { status: 409, data: { detail: 'taken' } })
    renderApp('/profile', { user: customer })

    const email = await screen.findByLabelText('Email')
    await userEvent.clear(email)
    await userEvent.type(email, 'otro@booqi.com')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Este email ya está registrado.')).toBeInTheDocument()
    expect(useSessionStore.getState().user).toEqual(customer)
  })

  it('sends nothing when nothing changed', async () => {
    const api = installFakeApi()
    renderApp('/profile', { user: customer })

    await userEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('No hay cambios que guardar')).toBeInTheDocument()
    expect(api.requests).toEqual([])
  })

  it('sends a new password only when filled and confirmed', async () => {
    const api = installFakeApi()
    api.put('/api/v1/users/1', { status: 200, data: customer })
    renderApp('/profile', { user: customer })

    await userEvent.type(await screen.findByLabelText('Nueva contraseña (opcional)'), 'nuevaclave')
    await userEvent.type(screen.getByLabelText('Repite la nueva contraseña'), 'nuevaclave')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(api.requests).toHaveLength(1))
    expect(api.requests[0]!.body).toStrictEqual({ password: 'nuevaclave' })
  })
})
