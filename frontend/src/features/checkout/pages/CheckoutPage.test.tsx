import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi, type FakeApi } from '../../../test/fake-api'
import { bookingWith } from '../../../test/fixtures/bookings'
import { eventWith } from '../../../test/fixtures/events'
import { paymentWith, rejectedPayment } from '../../../test/fixtures/payments'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import { useCartStore } from '../../cart/hooks/cart-store'

const customer = { ...userWith('CUSTOMER'), id: 7 }
const jazz = eventWith({ id: 4, title: 'Jazz en Madrid', price: 12.5 })
const rock = eventWith({ id: 7, title: 'Rock en Madrid', price: 30 })

function backend(rejectEvents: number[] = []) {
  const api = installFakeApi()
  let id = 42
  api.post('/api/v1/bookings', (request) => {
    const body = request.body as { eventId: number; ticketQuantity: number }
    return {
      status: 201,
      data: bookingWith({ id: id++, eventId: body.eventId, ticketQuantity: body.ticketQuantity }),
    }
  })
  api.post('/api/v1/payments', (request) => {
    const body = request.body as { eventId: number; bookingId: number }
    const base = rejectEvents.includes(body.eventId) ? rejectedPayment : paymentWith({})
    return { status: 201, data: { ...base, bookingId: body.bookingId, eventId: body.eventId } }
  })
  return api
}

async function goToPayment() {
  await userEvent.click(await screen.findByRole('button', { name: 'Continuar al pago' }))
}

async function payWithCard(cardNumber = '4242 4242 4242 4242') {
  await goToPayment()
  await userEvent.type(screen.getByLabelText('Titular de la tarjeta'), 'Mel García')
  await userEvent.type(screen.getByLabelText('Número de tarjeta'), cardNumber)
  await userEvent.type(screen.getByLabelText('Caducidad (MM/AA)'), '12/35')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
  await userEvent.click(screen.getByRole('button', { name: /^Pagar/ }))
}

function paymentsSent(api: FakeApi) {
  return api.requestsTo('POST', '/api/v1/payments')
}

describe('CheckoutPage', () => {
  it('reviews the order before asking for the payment', async () => {
    backend()
    useCartStore.setState({ lines: [{ event: jazz, quantity: 2 }] })
    renderApp('/checkout', { user: customer })

    const review = within(await screen.findByRole('region', { name: 'Revisa tu pedido' }))
    expect(review.getByText('Jazz en Madrid')).toBeInTheDocument()
    expect(review.getByText('25,00 €', { selector: '[data-checkout-total]' })).toBeInTheDocument()

    await goToPayment()

    expect(screen.getByRole('radio', { name: /Tarjeta de crédito/ })).toBeChecked()
    expect(screen.getByRole('button', { name: /^Pagar 25,00\s€$/ })).toBeInTheDocument()
  })

  it('shows a card error under its field and sends nothing', async () => {
    const api = backend()
    useCartStore.setState({ lines: [{ event: jazz, quantity: 2 }] })
    renderApp('/checkout', { user: customer })

    await payWithCard('1234')

    expect(
      await screen.findByText('El número de tarjeta debe tener entre 13 y 19 dígitos'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Número de tarjeta')).toHaveAttribute('aria-invalid', 'true')
    expect(api.requests).toEqual([])
  })

  it('hides the card fields for PayPal and sends cardNumber null', async () => {
    const api = backend()
    useCartStore.setState({ lines: [{ event: jazz, quantity: 2 }] })
    renderApp('/checkout', { user: customer })

    await goToPayment()
    await userEvent.click(screen.getByRole('radio', { name: /PayPal/ }))
    expect(screen.queryByLabelText('Número de tarjeta')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Pagar 25,00\s€$/ }))

    await waitFor(() => expect(paymentsSent(api)).toHaveLength(1))
    expect(paymentsSent(api)[0]!.body).toMatchObject({ paymentMethod: 'PAYPAL', cardNumber: null })
  })

  it('confirms an all-approved checkout with the animation, code, QR and download', async () => {
    const api = backend()
    useCartStore.setState({ lines: [{ event: jazz, quantity: 2 }] })
    renderApp('/checkout', { user: customer })

    await payWithCard()

    expect(await screen.findByRole('heading', { name: '¡Pago completado!' })).toBeInTheDocument()
    expect(screen.getByTestId('success-burst')).toBeInTheDocument()
    const result = within(screen.getByRole('listitem', { name: 'Jazz en Madrid' }))
    expect(result.getByText('42')).toBeInTheDocument()
    expect(
      await result.findByRole('img', { name: 'Código QR de la reserva 42' }),
    ).toBeInTheDocument()
    expect(result.getByRole('button', { name: 'Descargar entradas' })).toBeEnabled()
    expect(useCartStore.getState().lines).toEqual([])
    expect(paymentsSent(api)[0]!.body).toMatchObject({
      bookingId: 42,
      totalPrice: 25,
      cardNumber: '4242424242424242',
    })
    expect(document.body).not.toHaveTextContent(/correo|email/i)
  })

  it('lists both results of a mixed checkout without confetti and keeps the rejected line', async () => {
    backend([7])
    useCartStore.setState({
      lines: [
        { event: jazz, quantity: 2 },
        { event: rock, quantity: 1 },
      ],
    })
    renderApp('/checkout', { user: customer })

    await payWithCard()

    expect(await screen.findByRole('heading', { name: 'Resultado del pago' })).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: 'Jazz en Madrid' })).toHaveTextContent('Pagado')
    expect(screen.getByRole('listitem', { name: 'Rock en Madrid' })).toHaveTextContent(
      'Payment rejected by simulation',
    )
    expect(screen.queryByTestId('success-burst')).not.toBeInTheDocument()
    expect(useCartStore.getState().lines.map((line) => line.event.id)).toEqual([7])
    expect(document.body).not.toHaveTextContent(/correo|email/i)
  })

  it('shows the rejection without animation when the only payment is rejected', async () => {
    backend([4])
    useCartStore.setState({ lines: [{ event: jazz, quantity: 2 }] })
    renderApp('/checkout', { user: customer })

    await payWithCard('4111 1111 1111 1111')

    const result = await screen.findByRole('listitem', { name: 'Jazz en Madrid' })
    expect(result).toHaveTextContent('Pago rechazado')
    expect(result).toHaveTextContent('Payment rejected by simulation')
    expect(screen.queryByTestId('success-burst')).not.toBeInTheDocument()
    expect(useCartStore.getState().lines).toHaveLength(1)
  })

  it('toasts a payment request failure with its detail', async () => {
    const api = backend()
    api.post('/api/v1/payments', {
      status: 422,
      data: { detail: 'Total price must not exceed 99999999.99' },
    })
    useCartStore.setState({ lines: [{ event: jazz, quantity: 2 }] })
    renderApp('/checkout', { user: customer })

    await payWithCard()

    expect(
      await within(screen.getAllByRole('status').at(-1)!).findByText(
        'Total price must not exceed 99999999.99',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: 'Jazz en Madrid' })).toHaveTextContent(
      'No se pudo completar',
    )
  })

  it('shows an empty state when there is nothing to pay', async () => {
    backend()
    renderApp('/checkout', { user: customer })

    expect(
      await screen.findByRole('heading', { name: 'No hay nada que pagar' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar eventos' })).toHaveAttribute(
      'href',
      '/events',
    )
  })
})
