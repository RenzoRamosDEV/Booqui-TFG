// MOCK: backend en memoria que sustituye a los cuatro servicios en las pruebas E2E y en la demo
// de GitHub Pages, que no tiene servidor; sigue las reglas de docs/API_CONTRACT.md.
import type { BookingResponse } from '../types/booking'
import type { EventResponse } from '../types/event'
import type { PaymentResponse } from '../types/payment'
import type { UserResponse } from '../types/user'

export type MockState = {
  users: UserResponse[]
  events: EventResponse[]
  bookings: BookingResponse[]
  payments: PaymentResponse[]
  passwords: Record<string, string>
  lastId: number
}

export type MockRequest = {
  method: string
  path: string
  query?: URLSearchParams
  body?: unknown
}

export type MockReply = { status: number; json?: unknown }

export type MockClock = { now: () => string; uuid: () => string }

export const MAX_TOTAL_PRICE = 99999999.99

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
}

type Body = Record<string, unknown>

function localTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

const systemClock: MockClock = { now: () => localTimestamp(), uuid: () => crypto.randomUUID() }

function nonNull(body: Body): Body {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value != null))
}

function withoutPassword(body: Body): Body {
  const rest = { ...body }
  delete rest.password
  return rest
}

class Handler {
  private readonly state: MockState
  private readonly request: MockRequest
  private readonly clock: MockClock
  private readonly body: Body

  constructor(state: MockState, request: MockRequest, clock: MockClock) {
    this.state = state
    this.request = request
    this.clock = clock
    this.body = (request.body ?? {}) as Body
  }

  problem(status: number, detail: string): MockReply {
    const json = { type: 'about:blank', title: TITLES[status], status, detail }
    return { status, json: { ...json, instance: this.request.path } }
  }

  nextId() {
    this.state.lastId += 1
    return this.state.lastId
  }

  users(id: number | undefined, rawId: string | undefined): MockReply | undefined {
    const { state, body } = this
    const method = this.request.method
    if (rawId === 'login') {
      if (method !== 'POST') return undefined
      const user = state.users.find((candidate) => candidate.contactEmail === body.contactEmail)
      return user && state.passwords[user.contactEmail] === body.password
        ? { status: 200, json: user }
        : this.problem(401, 'Invalid email or password')
    }
    if (id === undefined) {
      if (method === 'GET') return { status: 200, json: state.users }
      if (method !== 'POST') return undefined
      const email = String(body.contactEmail)
      if (state.users.some((user) => user.contactEmail === email)) {
        return this.problem(409, `User with contactEmail ${email} already exists`)
      }
      const now = this.clock.now()
      const user = {
        contactPhone: null,
        ...withoutPassword(body),
        id: this.nextId(),
        createdAt: now,
        updatedAt: now,
      } as UserResponse
      state.users.push(user)
      state.passwords[email] = String(body.password)
      return { status: 201, json: user }
    }
    const index = state.users.findIndex((user) => user.id === id)
    if (index === -1) return this.problem(404, `User with id ${id} not found`)
    const current = state.users[index]!
    if (method === 'GET') return { status: 200, json: current }
    if (method === 'PUT') {
      const patch = nonNull(body)
      const updated = {
        ...current,
        ...withoutPassword(patch),
        updatedAt: this.clock.now(),
      } as UserResponse
      const password =
        (patch.password as string | undefined) ?? state.passwords[current.contactEmail]!
      delete state.passwords[current.contactEmail]
      state.passwords[updated.contactEmail] = password
      state.users[index] = updated
      return { status: 200, json: updated }
    }
    if (method === 'DELETE') {
      state.users.splice(index, 1)
      return { status: 204 }
    }
    return undefined
  }

  events(id: number | undefined): MockReply | undefined {
    const { state, body } = this
    const method = this.request.method
    if (id === undefined) {
      if (method === 'GET') return { status: 200, json: state.events }
      if (method !== 'POST') return undefined
      const now = this.clock.now()
      const event = {
        description: null,
        imageUrl: null,
        ...body,
        id: this.nextId(),
        createdAt: now,
        updatedAt: now,
      } as EventResponse
      state.events.push(event)
      return { status: 201, json: event }
    }
    const index = state.events.findIndex((event) => event.id === id)
    if (index === -1) return this.problem(404, `Event with id ${id} not found`)
    if (method === 'GET') return { status: 200, json: state.events[index] }
    if (method === 'PUT') {
      const updated = { ...state.events[index]!, ...nonNull(body), updatedAt: this.clock.now() }
      state.events[index] = updated as EventResponse
      return { status: 200, json: updated }
    }
    if (method === 'DELETE') {
      state.events.splice(index, 1)
      return { status: 204 }
    }
    return undefined
  }

  bookings(id: number | undefined, action: string | undefined): MockReply | undefined {
    const { state, body } = this
    const method = this.request.method
    if (id === undefined) {
      if (method === 'GET') {
        const userId = this.request.query?.get('userId')
        const list = userId
          ? state.bookings.filter((booking) => booking.userId === Number(userId))
          : state.bookings
        return { status: 200, json: list }
      }
      if (method !== 'POST') return undefined
      const user = state.users.find((candidate) => candidate.id === body.userId)
      if (!user) return this.problem(404, `User with id ${String(body.userId)} not found`)
      const event = state.events.find((candidate) => candidate.id === body.eventId)
      if (!event) return this.problem(404, `Event with id ${String(body.eventId)} not found`)
      const quantity = Number(body.ticketQuantity)
      const now = this.clock.now()
      const booking: BookingResponse = {
        id: this.nextId(),
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
        createdAt: now,
        updatedAt: now,
      }
      state.bookings.push(booking)
      return { status: 201, json: booking }
    }
    const booking = state.bookings.find((candidate) => candidate.id === id)
    if (!booking) return this.problem(404, `Booking with id ${id} not found`)
    if (method === 'GET' && action === undefined) return { status: 200, json: booking }
    if (method === 'PATCH' && (action === 'cancel' || action === 'confirm')) {
      booking.status = action === 'cancel' ? 'CANCELLED' : 'CONFIRMED'
      booking.updatedAt = this.clock.now()
      return { status: 200, json: booking }
    }
    return undefined
  }

  /** Mirrors PaymentServiceImpl.process: remote failures turn into a REJECTED payment, not an error. */
  settle(approvedByCard: boolean): string | null {
    const { state, body } = this
    if (!approvedByCard) return 'Payment rejected by simulation'
    const quantity = Number(body.ticketQuantity)
    const event = state.events.find((candidate) => candidate.id === body.eventId)
    if (!event) return `Event with id ${String(body.eventId)} not found`
    if (event.availableTickets < quantity) {
      return `Insufficient stock for event ${event.id}: available ${event.availableTickets}, requested ${quantity}`
    }
    event.availableTickets -= quantity
    const booking = state.bookings.find((candidate) => candidate.id === body.bookingId)
    if (!booking) return `Booking with id ${String(body.bookingId)} not found`
    booking.status = 'CONFIRMED'
    return null
  }

  payments(id: number | undefined): MockReply | undefined {
    const { state, body } = this
    const method = this.request.method
    if (id !== undefined) return undefined
    if (method === 'GET') return { status: 200, json: state.payments }
    if (method !== 'POST') return undefined
    if (Number(body.totalPrice) > MAX_TOTAL_PRICE) {
      return this.problem(422, 'Total price must not exceed 99999999.99')
    }
    const card = typeof body.cardNumber === 'string' ? body.cardNumber : ''
    const errorMessage = this.settle(card === '' || Number(card.at(-1)) % 2 === 0)
    if (errorMessage !== null) {
      const booking = state.bookings.find((candidate) => candidate.id === body.bookingId)
      if (booking) booking.status = 'CANCELLED'
    }
    const approved = errorMessage === null
    const now = this.clock.now()
    const payment: PaymentResponse = {
      id: this.nextId(),
      bookingId: Number(body.bookingId),
      userId: Number(body.userId),
      eventId: Number(body.eventId),
      ticketQuantity: Number(body.ticketQuantity),
      totalPrice: Number(body.totalPrice),
      paymentMethod: body.paymentMethod as PaymentResponse['paymentMethod'],
      status: approved ? 'APPROVED' : 'REJECTED',
      transactionId: approved ? this.clock.uuid() : null,
      errorMessage,
      paymentDate: approved ? now : null,
      createdAt: now,
      updatedAt: now,
    }
    state.payments.push(payment)
    return { status: 201, json: payment }
  }

  route(): MockReply {
    const { method, path } = this.request
    const [resource, rawId, action] = path.split('/').slice(3)
    const numeric = rawId !== undefined && /^\d+$/.test(rawId)
    if (rawId !== undefined && !numeric && !(resource === 'users' && rawId === 'login')) {
      return this.problem(400, "Invalid value for path variable 'id'")
    }
    const id = numeric ? Number(rawId) : undefined
    const reply =
      resource === 'users'
        ? this.users(id, rawId)
        : resource === 'events'
          ? this.events(id)
          : resource === 'bookings'
            ? this.bookings(id, action)
            : resource === 'payments'
              ? this.payments(id)
              : undefined
    return reply ?? this.problem(404, `No mock for ${method} ${path}`)
  }
}

export function handleMockRequest(
  state: MockState,
  request: MockRequest,
  clock: MockClock = systemClock,
): MockReply {
  return new Handler(state, request, clock).route()
}
