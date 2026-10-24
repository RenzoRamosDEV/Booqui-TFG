import type { Page, Route } from '@playwright/test'
import { jazzBooking } from '../../src/test/fixtures/bookings'
import { foodEvent, jazzEvent, rockEvent } from '../../src/test/fixtures/events'
import type { BookingResponse } from '../../src/types/booking'
import type { EventResponse } from '../../src/types/event'
import type { PaymentResponse } from '../../src/types/payment'
import type { UserResponse } from '../../src/types/user'

export const customer: UserResponse = {
  id: 7,
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '1995-04-12',
  contactPhone: null,
  contactEmail: 'mel@booqi.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-10T09:30:00',
  updatedAt: '2026-01-10T09:30:00',
}

export const admin: UserResponse = {
  ...customer,
  id: 1,
  firstName: 'Alex',
  lastName: 'Admin',
  contactEmail: 'admin@booqi.com',
  role: 'ADMIN',
}

export const PASSWORD = 'secreto123'

export type MockState = {
  users: UserResponse[]
  events: EventResponse[]
  bookings: BookingResponse[]
  payments: PaymentResponse[]
}

export function defaultState(): MockState {
  return {
    users: [admin, customer],
    events: [jazzEvent, rockEvent, foodEvent].map((event) => ({ ...event })),
    bookings: [],
    payments: [],
  }
}

const NOW = '2030-01-12T10:00:00'
const problem = (status: number, detail: string) => ({ status, json: { status, detail } })

let sequence = 1000
const nextId = () => (sequence += 1)

type Reply = { status: number; json?: unknown }

function withoutPassword(body: Record<string, unknown>) {
  const data = { ...body }
  delete data.password
  return data
}

function handle(
  state: MockState,
  method: string,
  path: string,
  query: URLSearchParams,
  body: Record<string, unknown>,
): Reply {
  const segments = path.replace(/^\/api\/v1\//, '').split('/')
  const [resource, rawId, action] = segments
  const id = Number(rawId)

  if (resource === 'users') {
    if (rawId === 'login' && method === 'POST') {
      const user = state.users.find((candidate) => candidate.contactEmail === body.contactEmail)
      return user && body.password === PASSWORD
        ? { status: 200, json: user }
        : problem(401, 'Invalid email or password')
    }
    if (!rawId && method === 'GET') return { status: 200, json: state.users }
    if (!rawId && method === 'POST') {
      if (state.users.some((user) => user.contactEmail === body.contactEmail)) {
        return problem(409, `User with contactEmail ${String(body.contactEmail)} already exists`)
      }
      const user = {
        ...customer,
        contactPhone: null,
        ...withoutPassword(body),
        id: nextId(),
      } as UserResponse
      state.users.push(user)
      return { status: 201, json: user }
    }
    const index = state.users.findIndex((user) => user.id === id)
    if (index === -1) return problem(404, `User with id ${rawId} not found`)
    if (method === 'PUT') {
      state.users[index] = { ...state.users[index]!, ...withoutPassword(body) }
      return { status: 200, json: state.users[index] }
    }
    if (method === 'DELETE') {
      state.users.splice(index, 1)
      return { status: 204 }
    }
  }

  if (resource === 'events') {
    if (!rawId && method === 'GET') return { status: 200, json: state.events }
    if (!rawId && method === 'POST') {
      const event = {
        ...jazzEvent,
        imageUrl: null,
        description: null,
        ...body,
        id: nextId(),
      } as EventResponse
      state.events.push(event)
      return { status: 201, json: event }
    }
    const index = state.events.findIndex((event) => event.id === id)
    if (index === -1) return problem(404, `Event with id ${rawId} not found`)
    if (method === 'GET') return { status: 200, json: state.events[index] }
    if (method === 'PUT') {
      state.events[index] = { ...state.events[index]!, ...body }
      return { status: 200, json: state.events[index] }
    }
    if (method === 'DELETE') {
      state.events.splice(index, 1)
      return { status: 204 }
    }
  }

  if (resource === 'bookings') {
    if (!rawId && method === 'GET') {
      const userId = query.get('userId')
      const list = userId
        ? state.bookings.filter((b) => b.userId === Number(userId))
        : state.bookings
      return { status: 200, json: list }
    }
    if (!rawId && method === 'POST') {
      const user = state.users.find((candidate) => candidate.id === body.userId)
      const event = state.events.find((candidate) => candidate.id === body.eventId)
      if (!user) return problem(404, `User with id ${String(body.userId)} not found`)
      if (!event) return problem(404, `Event with id ${String(body.eventId)} not found`)
      const quantity = Number(body.ticketQuantity)
      const booking: BookingResponse = {
        ...jazzBooking,
        id: nextId(),
        userId: user.id,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userEmail: user.contactEmail,
        eventId: event.id,
        eventTitle: event.title,
        eventDescription: event.description,
        eventStartDate: event.startDate,
        eventLocation: event.location,
        ticketQuantity: quantity,
        basePrice: event.price,
        totalPrice: event.price * quantity,
        status: 'PENDING',
        createdAt: NOW,
        updatedAt: NOW,
      }
      state.bookings.push(booking)
      return { status: 201, json: booking }
    }
    const booking = state.bookings.find((candidate) => candidate.id === id)
    if (!booking) return problem(404, `Booking with id ${rawId} not found`)
    if (method === 'PATCH' && action === 'cancel') {
      booking.status = 'CANCELLED'
      return { status: 200, json: booking }
    }
  }

  if (resource === 'payments') {
    if (!rawId && method === 'GET') return { status: 200, json: state.payments }
    if (!rawId && method === 'POST') {
      if (Number(body.totalPrice) > 99999999.99) {
        return problem(422, 'Total price must not exceed 99999999.99')
      }
      const card = typeof body.cardNumber === 'string' ? body.cardNumber : ''
      const approved = card === '' || Number(card.at(-1)) % 2 === 0
      const booking = state.bookings.find((candidate) => candidate.id === body.bookingId)
      const event = state.events.find((candidate) => candidate.id === body.eventId)
      if (booking) booking.status = approved ? 'CONFIRMED' : 'CANCELLED'
      if (approved && event) event.availableTickets -= Number(body.ticketQuantity)
      const payment: PaymentResponse = {
        id: nextId(),
        bookingId: Number(body.bookingId),
        userId: Number(body.userId),
        eventId: Number(body.eventId),
        ticketQuantity: Number(body.ticketQuantity),
        totalPrice: Number(body.totalPrice),
        paymentMethod: body.paymentMethod as PaymentResponse['paymentMethod'],
        status: approved ? 'APPROVED' : 'REJECTED',
        transactionId: approved ? crypto.randomUUID() : null,
        errorMessage: approved ? null : 'Payment rejected by simulation',
        paymentDate: approved ? NOW : null,
        createdAt: NOW,
        updatedAt: NOW,
      }
      state.payments.push(payment)
      return { status: 201, json: payment }
    }
  }

  return problem(404, `No mock for ${method} ${path}`)
}

/** Answers every `/api/v1/...` request from an in-memory backend that mirrors the real rules. */
export async function mockApi(page: Page, state: MockState = defaultState()): Promise<MockState> {
  await page.route('**/api/v1/**', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>
    const reply = handle(state, request.method(), url.pathname, url.searchParams, body)
    await route.fulfill({ status: reply.status, json: reply.json })
  })
  return state
}

export async function signInAs(page: Page, user: UserResponse) {
  await page.addInitScript(
    (stored) => localStorage.setItem('booqi-session', stored),
    JSON.stringify({ state: { user }, version: 0 }),
  )
}
