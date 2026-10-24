import { act, renderHook, screen } from '@testing-library/react'
import { installFakeApi } from '../../../test/fake-api'
import { bookingWith } from '../../../test/fixtures/bookings'
import { eventWith } from '../../../test/fixtures/events'
import { paymentWith, rejectedPayment } from '../../../test/fixtures/payments'
import { hookWrapper } from '../../../test/hook-wrapper'
import { bookingKeys } from '../../bookings/api/bookings-api'
import { useCartStore } from '../../cart/hooks/cart-store'
import { eventKeys } from '../../events/api/events-api'
import { useCheckout } from './use-checkout'

const jazz = eventWith({ id: 4, title: 'Jazz en Madrid', price: 12.5 })
const rock = eventWith({ id: 7, title: 'Rock en Madrid', price: 30 })
const payer = { userId: 7, method: 'CREDIT_CARD' as const, cardNumber: '4242424242424242' }

function serveBookings(api: ReturnType<typeof installFakeApi>) {
  let id = 42
  api.post('/api/v1/bookings', (request) => {
    const body = request.body as { eventId: number; ticketQuantity: number }
    return { status: 201, data: bookingWith({ id: id++, eventId: body.eventId }) }
  })
}

describe('useCheckout', () => {
  it('removes approved lines from the cart and keeps the others', async () => {
    useCartStore.setState({
      lines: [
        { event: jazz, quantity: 2 },
        { event: rock, quantity: 1 },
      ],
    })
    const api = installFakeApi()
    serveBookings(api)
    api.post('/api/v1/payments', (request) => {
      const body = request.body as { eventId: number; bookingId: number }
      const payment = body.eventId === 4 ? paymentWith({}) : rejectedPayment
      return { status: 201, data: { ...payment, bookingId: body.bookingId, eventId: body.eventId } }
    })
    const { wrapper } = hookWrapper()
    const { result } = renderHook(() => useCheckout(), { wrapper })

    const results = await act(() =>
      result.current.mutateAsync({ lines: useCartStore.getState().lines, payer }),
    )

    expect(results.map((line) => line.kind)).toEqual(['approved', 'rejected'])
    expect(useCartStore.getState().lines.map((line) => line.event.id)).toEqual([7])
  })

  it('toasts the message of each failed line', async () => {
    useCartStore.setState({ lines: [{ event: jazz, quantity: 1 }] })
    const api = installFakeApi()
    serveBookings(api)
    api.post('/api/v1/payments', {
      status: 422,
      data: { detail: 'Total price must not exceed 99999999.99' },
    })
    const { wrapper } = hookWrapper()
    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(() => result.current.mutateAsync({ lines: useCartStore.getState().lines, payer }))

    expect(await screen.findByText('Total price must not exceed 99999999.99')).toBeInTheDocument()
    expect(screen.getByText('Jazz en Madrid')).toBeInTheDocument()
    expect(useCartStore.getState().lines).toHaveLength(1)
  })

  it('refreshes events and bookings afterwards', async () => {
    useCartStore.setState({ lines: [{ event: jazz, quantity: 1 }] })
    const api = installFakeApi()
    serveBookings(api)
    api.post('/api/v1/payments', { status: 201, data: paymentWith({}) })
    const { wrapper, queryClient } = hookWrapper()
    queryClient.setQueryData(eventKeys.all, [])
    queryClient.setQueryData(bookingKeys.byUser(7), [])
    queryClient.setQueryData(['users'], [])
    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(() => result.current.mutateAsync({ lines: useCartStore.getState().lines, payer }))

    expect(queryClient.getQueryState(eventKeys.all)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(bookingKeys.byUser(7))?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(['users'])?.isInvalidated).toBe(false)
  })
})
