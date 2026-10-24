import { eventWith, jazzEvent, rockEvent } from '../../../test/fixtures/events'
import {
  cartTotalCents,
  lineTotalCents,
  maxQuantity,
  ticketCount,
  useCartStore,
  type CartLine,
} from './cart-store'

const cart = () => useCartStore.getState()
const event50 = eventWith({ id: 4, availableTickets: 50, price: 12.5 })

beforeEach(() => {
  useCartStore.setState({ lines: [] })
})

describe('maxQuantity', () => {
  it.each([
    [0, 0],
    [1, 1],
    [9, 9],
    [10, 10],
    [11, 10],
    [500, 10],
    [-3, 0],
  ])('stock %i allows %i', (stock, max) => {
    expect(maxQuantity(eventWith({ availableTickets: stock }))).toBe(max)
  })
})

describe('cart store', () => {
  it('starts empty', () => {
    expect(useCartStore.getInitialState().lines).toEqual([])
  })

  it('adds a new line with a snapshot of the event', () => {
    cart().add(event50, 2)

    expect(cart().lines).toEqual([{ event: event50, quantity: 2 }])
  })

  it('adds to the quantity of an event already in the cart', () => {
    cart().add(event50, 2)
    cart().add(event50, 3)

    expect(cart().lines).toEqual([{ event: event50, quantity: 5 }])
  })

  it('keeps one line per event', () => {
    cart().add(event50, 1)
    cart().add(rockEvent, 1)

    expect(cart().lines.map((line) => line.event.id)).toEqual([4, 7])
  })

  it('updates only the matching line when adding again', () => {
    cart().add(event50, 1)
    cart().add(rockEvent, 1)
    cart().add(rockEvent, 1)

    expect(cart().lines.map((line) => [line.event.id, line.quantity])).toEqual([
      [4, 1],
      [7, 2],
    ])
  })

  it('never lowers an existing line through add', () => {
    cart().add(event50, 3)
    cart().add(event50, -1)

    expect(cart().lines[0]!.quantity).toBe(3)
  })

  it('caps the sum at 10 tickets', () => {
    cart().add(event50, 9)
    cart().add(event50, 3)

    expect(cart().lines[0]!.quantity).toBe(10)
  })

  it.each([
    [1, 1],
    [10, 10],
    [11, 10],
    [500, 10],
  ])('caps an add of 20 at %i stock to %i', (stock, quantity) => {
    cart().add(eventWith({ availableTickets: stock }), 20)

    expect(cart().lines[0]!.quantity).toBe(quantity)
  })

  it.each([0, -1])('ignores an add of quantity %i', (quantity) => {
    cart().add(event50, quantity)

    expect(cart().lines).toEqual([])
  })

  it('adds nothing for a sold-out event', () => {
    cart().add(eventWith({ availableTickets: 0 }), 1)

    expect(cart().lines).toEqual([])
  })

  it('refreshes the event snapshot when adding again', () => {
    cart().add(event50, 1)
    const refreshed = { ...event50, availableTickets: 2 }
    cart().add(refreshed, 5)

    expect(cart().lines).toEqual([{ event: refreshed, quantity: 2 }])
  })

  describe('setQuantity', () => {
    beforeEach(() => {
      cart().add(event50, 3)
      cart().add(rockEvent, 1)
    })

    it('sets a quantity within bounds', () => {
      cart().setQuantity(4, 7)

      expect(cart().lines[0]!.quantity).toBe(7)
    })

    it('clamps above the cap', () => {
      cart().setQuantity(4, 11)

      expect(cart().lines[0]!.quantity).toBe(10)
    })

    it.each([0, -2])('removes the line at %i', (quantity) => {
      cart().setQuantity(4, quantity)

      expect(cart().lines.map((line) => line.event.id)).toEqual([7])
    })

    it('keeps the minimum of 1', () => {
      cart().setQuantity(4, 1)

      expect(cart().lines[0]!.quantity).toBe(1)
    })

    it('ignores unknown events', () => {
      cart().setQuantity(999, 2)

      expect(cart().lines.map((line) => [line.event.id, line.quantity])).toEqual([
        [4, 3],
        [7, 1],
      ])
    })
  })

  it('removes one line', () => {
    cart().add(event50, 1)
    cart().add(rockEvent, 1)

    cart().remove(4)

    expect(cart().lines.map((line) => line.event.id)).toEqual([7])
  })

  it('removes several lines', () => {
    cart().add(event50, 1)
    cart().add(rockEvent, 1)
    cart().add(eventWith({ id: 9 }), 1)

    cart().removeMany([4, 9])

    expect(cart().lines.map((line) => line.event.id)).toEqual([7])
  })

  it('clears every line', () => {
    cart().add(event50, 1)
    cart().add(rockEvent, 1)

    cart().clear()

    expect(cart().lines).toEqual([])
  })

  it('does not persist the cart', () => {
    cart().add(event50, 1)

    expect(localStorage.length).toBe(0)
  })
})

describe('selectors', () => {
  const lines: CartLine[] = [
    { event: eventWith({ id: 4, price: 12.5 }), quantity: 2 },
    { event: eventWith({ id: 7, price: 30 }), quantity: 1 },
  ]

  it('counts tickets across lines', () => {
    expect(ticketCount(lines)).toBe(3)
    expect(ticketCount([])).toBe(0)
  })

  it('totals the cart in cents', () => {
    expect(cartTotalCents(lines)).toBe(5500)
    expect(cartTotalCents([])).toBe(0)
  })

  it('totals one line in cents', () => {
    expect(lineTotalCents({ event: eventWith({ price: 19.99 }), quantity: 3 })).toBe(5997)
    expect(lineTotalCents({ event: jazzEvent, quantity: 2 })).toBe(2500)
  })
})
