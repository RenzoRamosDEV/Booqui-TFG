import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from './Toast'
import { useToast, type ToastOptions } from './use-toast'

function Trigger(options: ToastOptions) {
  const { show } = useToast()
  return <button onClick={() => show(options)}>Notificar</button>
}

function setup(options: ToastOptions) {
  render(
    <ToastProvider>
      <Trigger {...options} />
    </ToastProvider>,
  )
  return screen.getByRole('button', { name: 'Notificar' })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Toast', () => {
  it('renders an empty polite live region before any toast', () => {
    setup({ title: 'x' })

    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
  })

  it('announces a shown toast with its title and description', async () => {
    const trigger = setup({ title: 'Reserva creada', description: 'Te esperamos' })

    await userEvent.click(trigger)

    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('Reserva creada')
    expect(region).toHaveTextContent('Te esperamos')
  })

  it('dismisses automatically after its timeout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const trigger = setup({ title: 'Guardado', duration: 3000 })

    act(() => trigger.click())
    expect(screen.getByText('Guardado')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2999))
    expect(screen.getByText('Guardado')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    vi.useRealTimers()
    await waitFor(() => expect(screen.queryByText('Guardado')).not.toBeInTheDocument())
  })

  it('uses a 4 second default timeout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const trigger = setup({ title: 'Hola' })

    act(() => trigger.click())
    act(() => vi.advanceTimersByTime(3999))
    expect(screen.getByText('Hola')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1))
    vi.useRealTimers()
    await waitFor(() => expect(screen.queryByText('Hola')).not.toBeInTheDocument())
  })

  it('can be dismissed manually', async () => {
    const trigger = setup({ title: 'Error al pagar', tone: 'danger' })
    await userEvent.click(trigger)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }))

    await waitFor(() => expect(screen.queryByText('Error al pagar')).not.toBeInTheDocument())
  })

  it('stacks several toasts', async () => {
    const trigger = setup({ title: 'Uno' })

    await userEvent.click(trigger)
    await userEvent.click(trigger)

    expect(screen.getAllByText('Uno')).toHaveLength(2)
  })

  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Trigger title="x" />)).toThrow(
      'useToast must be used inside ToastProvider',
    )
  })
})
