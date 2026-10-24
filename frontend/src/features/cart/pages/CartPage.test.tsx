import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { installFakeApi } from '../../../test/fake-api'
import { eventWith } from '../../../test/fixtures/events'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import { useCartStore } from '../hooks/cart-store'

const jazz = eventWith({ id: 4, title: 'Jazz en Madrid', price: 12.5, availableTickets: 50 })
const rock = eventWith({ id: 7, title: 'Rock en Madrid', price: 30, availableTickets: 50 })

function fill() {
  useCartStore.setState({
    lines: [
      { event: jazz, quantity: 2 },
      { event: rock, quantity: 1 },
    ],
  })
}

function line(title: string) {
  return within(screen.getByRole('listitem', { name: title }))
}

describe('CartPage', () => {
  beforeEach(() => {
    installFakeApi()
  })

  it('lists each line with unit price, quantity and line total', async () => {
    fill()
    renderApp('/cart', { user: userWith('CUSTOMER') })

    await screen.findByRole('heading', { level: 1, name: 'Tu carrito' })
    expect(line('Jazz en Madrid').getByText('12,50 € / entrada')).toBeInTheDocument()
    expect(
      line('Jazz en Madrid').getByRole('status', { name: 'Entradas de Jazz en Madrid' }),
    ).toHaveTextContent('2')
    expect(line('Jazz en Madrid').getByText('25,00 €')).toBeInTheDocument()
    expect(
      line('Rock en Madrid').getByText('30,00 €', { selector: '[data-line-total]' }),
    ).toBeInTheDocument()
  })

  it('totals the lines to the cent and shows no fee', async () => {
    fill()
    renderApp('/cart', { user: userWith('CUSTOMER') })

    const summary = within(await screen.findByRole('complementary', { name: 'Resumen del pedido' }))
    expect(summary.getByTestId('cart-total')).toHaveTextContent('55,00 €')
    expect(document.body).not.toHaveTextContent(/comisi/i)
    expect(document.body).not.toHaveTextContent(/gastos de gesti/i)
  })

  it('changes quantities with + and − and removes a line at zero', async () => {
    fill()
    renderApp('/cart', { user: userWith('CUSTOMER') })
    await screen.findByRole('heading', { level: 1, name: 'Tu carrito' })

    await userEvent.click(
      line('Jazz en Madrid').getByRole('button', { name: 'Añadir una entrada de Jazz en Madrid' }),
    )
    expect(useCartStore.getState().lines[0]!.quantity).toBe(3)

    await userEvent.click(
      line('Rock en Madrid').getByRole('button', { name: 'Quitar una entrada de Rock en Madrid' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('listitem', { name: 'Rock en Madrid' })).not.toBeInTheDocument(),
    )
    expect(useCartStore.getState().lines.map((cartLine) => cartLine.event.id)).toEqual([4])
  })

  it('removes a line with its remove action', async () => {
    fill()
    renderApp('/cart', { user: userWith('CUSTOMER') })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Eliminar Jazz en Madrid del carrito' }),
    )

    expect(useCartStore.getState().lines.map((cartLine) => cartLine.event.id)).toEqual([7])
  })

  it('shows an empty state linking to the events', async () => {
    renderApp('/cart', { user: userWith('CUSTOMER') })

    expect(
      await screen.findByRole('heading', { name: 'Tu carrito está vacío' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar eventos' })).toHaveAttribute(
      'href',
      '/events',
    )
  })

  it('sends a visitor without session to login before paying', async () => {
    fill()
    const { router } = renderApp('/cart')

    await userEvent.click(await screen.findByRole('button', { name: 'Ir al pago' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?redirect=%2Fcheckout')
  })

  it('goes to checkout with a session', async () => {
    fill()
    const { router } = renderApp('/cart', { user: userWith('CUSTOMER') })

    await userEvent.click(await screen.findByRole('button', { name: 'Ir al pago' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/checkout'))
  })
})
