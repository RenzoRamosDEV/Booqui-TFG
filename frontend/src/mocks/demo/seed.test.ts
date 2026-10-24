import { userResponseSchema } from '../../features/auth/api/schemas'
import { bookingResponseSchema } from '../../features/bookings/api/schemas'
import { paymentResponseSchema } from '../../features/checkout/api/schemas'
import { EVENT_CATEGORIES } from '../../features/events/api/categories'
import { eventResponseSchema } from '../../features/events/api/schemas'
import { handleMockRequest } from '../mock-backend'
import { createDemoState, DEMO_ACCOUNTS } from './seed'

const NOW = new Date(2026, 9, 24, 23, 30, 0)
const toDate = (iso: string) => new Date(iso)

describe('demo accounts', () => {
  it('offers one customer and one admin with visible credentials', () => {
    expect(DEMO_ACCOUNTS.map((account) => account.role)).toEqual(['CUSTOMER', 'ADMIN'])
    for (const account of DEMO_ACCOUNTS) {
      expect(account.email).toMatch(/^\S+@\S+\.\S+$/)
      expect(account.password.length).toBeGreaterThanOrEqual(8)
    }
  })

  it.each(DEMO_ACCOUNTS)('$role can log in against the seeded backend', (account) => {
    const reply = handleMockRequest(createDemoState(NOW), {
      method: 'POST',
      path: '/api/v1/users/login',
      body: { contactEmail: account.email, password: account.password },
    })
    expect(reply.status).toBe(200)
    expect(reply.json).toMatchObject({ contactEmail: account.email, role: account.role })
  })
})

describe('createDemoState', () => {
  const state = createDemoState(NOW)

  it('matches the response schemas the app validates', () => {
    for (const user of state.users) expect(userResponseSchema.safeParse(user).success).toBe(true)
    for (const event of state.events) {
      expect(eventResponseSchema.safeParse(event).success).toBe(true)
    }
    for (const booking of state.bookings) {
      expect(bookingResponseSchema.safeParse(booking).success).toBe(true)
    }
    for (const payment of state.payments) {
      expect(paymentResponseSchema.safeParse(payment).success).toBe(true)
    }
  })

  it('has a varied catalogue of future events in known categories', () => {
    expect(state.events.length).toBeGreaterThanOrEqual(8)
    const categories = new Set(state.events.map((event) => event.category))
    expect(categories.size).toBeGreaterThanOrEqual(5)
    for (const event of state.events) {
      expect(EVENT_CATEGORIES).toContain(event.category)
      expect(toDate(event.startDate).getTime()).toBeGreaterThan(NOW.getTime())
      expect(toDate(event.endDate).getTime()).toBeGreaterThan(toDate(event.startDate).getTime())
      expect(event.availableTickets).toBeGreaterThan(0)
    }
    expect(state.events.some((event) => event.price === 0)).toBe(true)
    expect(state.events.some((event) => event.availableTickets <= 5)).toBe(true)
  })

  it('has the first event within the next week so the home has something soon', () => {
    const soonest = Math.min(...state.events.map((event) => toDate(event.startDate).getTime()))
    expect(soonest - NOW.getTime()).toBeLessThanOrEqual(7 * 24 * 3600 * 1000)
  })

  it('uses Spanish text with real accents, no mojibake and no external images', () => {
    const text = JSON.stringify(state)
    expect(text).toMatch(/[áéíóúñ]/)
    expect(text).not.toMatch(/Ã|Â|�/)
    for (const event of state.events) expect(event.imageUrl).toBeNull()
  })

  it('moves every date along with the clock', () => {
    const june = new Date(2026, 5, 10, 12, 0, 0)
    const before = createDemoState(june)
    const later = createDemoState(new Date(june.getTime() + 24 * 3600 * 1000))
    before.events.forEach((event, index) => {
      const shifted = later.events[index]!
      expect(toDate(shifted.startDate).getTime() - toDate(event.startDate).getTime()).toBe(
        24 * 3600 * 1000,
      )
    })
  })

  it('formats dates as local timestamps without zone or fractions', () => {
    for (const event of state.events) {
      expect(event.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
      expect(event.createdAt <= '2026-10-24T23:30:00').toBe(true)
    }
  })

  it('gives the demo customer a confirmed booking paid with an approved payment', () => {
    const customer = state.users.find((user) => user.contactEmail === DEMO_ACCOUNTS[0].email)!
    const confirmed = state.bookings.filter(
      (booking) => booking.userId === customer.id && booking.status === 'CONFIRMED',
    )
    expect(confirmed.length).toBeGreaterThan(0)
    for (const booking of confirmed) {
      const event = state.events.find((candidate) => candidate.id === booking.eventId)!
      expect(booking).toMatchObject({
        eventTitle: event.title,
        eventStartDate: event.startDate,
        basePrice: event.price,
        totalPrice: event.price * booking.ticketQuantity,
        userEmail: customer.contactEmail,
      })
      expect(state.payments).toContainEqual(
        expect.objectContaining({ bookingId: booking.id, status: 'APPROVED' }),
      )
    }
  })

  it('gives every user a valid, unique email and an adult birth date', () => {
    const emails = state.users.map((user) => user.contactEmail)
    expect(new Set(emails).size).toBe(emails.length)
    for (const user of state.users) {
      expect(user.contactEmail).toMatch(/^\S+@\S+\.\S+$/)
      expect(user.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(user.dateOfBirth < '2008-01-01').toBe(true)
    }
  })

  it('gives every event a Spanish contact phone', () => {
    for (const event of state.events) expect(event.contactPhone).toMatch(/^\+34\d{9}$/)
  })

  it('gives every approved payment its own transaction UUID', () => {
    const ids = state.payments.map((payment) => payment.transactionId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    }
  })

  it('lists every collection in ascending id order, as the API does', () => {
    for (const list of [state.users, state.events, state.bookings, state.payments]) {
      const ids = list.map((item) => item.id)
      expect(ids).toEqual([...ids].sort((a, b) => a - b))
    }
  })

  it('keeps ids unique and below the next id the backend will assign', () => {
    const ids = [state.users, state.events, state.bookings, state.payments].flatMap((list) =>
      list.map((item) => item.id),
    )
    expect(new Set(ids).size).toBe(ids.length)
    expect(Math.max(...ids)).toBeLessThan(state.lastId + 1)
  })

  it('returns a fresh, independent state on every call', () => {
    const first = createDemoState(NOW)
    first.events[0]!.availableTickets = 0
    first.users.pop()
    expect(createDemoState(NOW)).toEqual(state)
  })
})
