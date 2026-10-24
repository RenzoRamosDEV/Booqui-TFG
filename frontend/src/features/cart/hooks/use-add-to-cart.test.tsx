import { act, renderHook, screen } from '@testing-library/react'
import { jazzEvent } from '../../../test/fixtures/events'
import { hookWrapper, type LocationProbe } from '../../../test/hook-wrapper'
import { userWith } from '../../../test/users'
import { useSessionStore } from '../../auth/hooks/session-store'
import { useCartStore } from './cart-store'
import { useAddToCart } from './use-add-to-cart'

describe('useAddToCart', () => {
  it('redirects an anonymous visitor to login keeping the current path and query', () => {
    const location: LocationProbe = { pathname: '', search: '' }
    const { wrapper } = hookWrapper('/events?q=jazz', location)
    const { result } = renderHook(() => useAddToCart(), { wrapper })

    act(() => result.current(jazzEvent, 2))

    expect(location.pathname).toBe('/login')
    expect(location.search).toBe('?redirect=%2Fevents%3Fq%3Djazz')
    expect(useCartStore.getState().lines).toEqual([])
  })

  it('adds the event and confirms with a success toast for a signed-in user', async () => {
    useSessionStore.setState({ user: userWith('CUSTOMER') })
    const location: LocationProbe = { pathname: '', search: '' }
    const { wrapper } = hookWrapper('/events/4', location)
    const { result } = renderHook(() => useAddToCart(), { wrapper })

    act(() => result.current(jazzEvent, 2))

    expect(useCartStore.getState().lines).toEqual([{ event: jazzEvent, quantity: 2 }])
    expect(location.pathname).toBe('/events/4')
    expect(await screen.findByText('Añadido al carrito')).toBeInTheDocument()
    expect(screen.getByText('2 × Jazz en Madrid')).toBeInTheDocument()
  })
})
