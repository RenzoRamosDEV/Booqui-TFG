import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi } from '../../../test/fake-api'
import { renderApp } from '../../../test/render-app'

async function fill(values: Partial<Record<'Nombre' | 'Email' | 'Asunto' | 'Mensaje', string>>) {
  for (const [label, value] of Object.entries(values)) {
    if (value) await userEvent.type(await screen.findByLabelText(label), value)
  }
  await userEvent.click(await screen.findByRole('button', { name: 'Enviar mensaje' }))
}

describe('ContactPage', () => {
  it('shows the Demo badge and makes no email promise about tickets', async () => {
    installFakeApi()
    renderApp('/contact')

    expect(await screen.findByText('Demo')).toBeInTheDocument()
    expect(screen.getByText(/los mensajes no se envían/i)).toBeInTheDocument()
    expect(screen.getByRole('main')).not.toHaveTextContent(/email.*(ticket|entrada)/i)
    expect(screen.queryByText(/pr\u00f3ximamente/i)).not.toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Contacto · Booqi'))
  })

  it('requires every field', async () => {
    const api = installFakeApi()
    renderApp('/contact')

    await fill({})

    for (const message of [
      'Indica tu nombre',
      'Indica tu email',
      'Indica el asunto',
      'Escribe tu mensaje',
    ]) {
      expect(await screen.findByText(message)).toBeInTheDocument()
    }
    expect(api.requests).toEqual([])
  })

  it('validates the email format', async () => {
    installFakeApi()
    renderApp('/contact')

    await fill({ Nombre: 'Mel', Email: 'mel@', Asunto: 'Duda', Mensaje: 'Hola' })

    expect(await screen.findByText('El email debe ser válido')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('simulates the submission without calling the backend', async () => {
    const api = installFakeApi()
    renderApp('/contact')

    await fill({
      Nombre: 'Mel',
      Email: 'mel@booqi.com',
      Asunto: 'Duda',
      Mensaje: 'Hola, ¿qué tal?',
    })

    expect(await screen.findByRole('heading', { name: '¡Mensaje recibido!' })).toBeInTheDocument()
    expect(screen.getByText('Demo')).toBeInTheDocument()
    expect(api.requests.filter((request) => request.path.startsWith('/api/v1'))).toEqual([])
    expect(screen.getByRole('main')).not.toHaveTextContent(/email.*(ticket|entrada)/i)
  })

  it('lets the visitor write another message', async () => {
    installFakeApi()
    renderApp('/contact')
    await fill({ Nombre: 'Mel', Email: 'mel@booqi.com', Asunto: 'Duda', Mensaje: 'Hola' })

    await userEvent.click(await screen.findByRole('button', { name: 'Escribir otro mensaje' }))

    expect(screen.getByLabelText('Nombre')).toHaveValue('')
  })
})
