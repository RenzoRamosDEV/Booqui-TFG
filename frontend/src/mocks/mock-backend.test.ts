import { foodEvent, jazzEvent, rockEvent } from '../test/fixtures/events'
import type { BookingResponse } from '../types/booking'
import type { EventResponse } from '../types/event'
import type { PaymentResponse } from '../types/payment'
import type { UserResponse } from '../types/user'
import {
  handleMockRequest,
  MAX_TOTAL_PRICE,
  type MockRequest,
  type MockState,
} from './mock-backend'

const NOW = '2031-02-03T04:05:06'
const UUID = '00000000-0000-4000-8000-000000000001'
const clock = { now: () => NOW, uuid: () => UUID }

const customer: UserResponse = {
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
const admin: UserResponse = {
  ...customer,
  id: 1,
  contactEmail: 'admin@booqi.com',
  role: 'ADMIN',
}

function state(): MockState {
  return {
    users: [admin, customer].map((user) => ({ ...user })),
    events: [jazzEvent, rockEvent, foodEvent].map((event) => ({ ...event })),
    bookings: [],
    payments: [],
    passwords: { 'admin@booqi.com': 'admin-pass', 'mel@booqi.com': 'mel-pass' },
    lastId: 100,
  }
}

function send(s: MockState, request: MockRequest) {
  return handleMockRequest(s, request, clock)
}

function expectProblem(reply: { status: number; json?: unknown }, status: number, detail: string) {
  expect(reply.status).toBe(status)
  expect(reply.json).toEqual({
    type: 'about:blank',
    title: expect.any(String),
    status,
    detail,
    instance: expect.stringMatching(/^\/api\/v1\//),
  })
}

describe('users', () => {
  it('logs in with the stored password and never returns it', () => {
    const reply = send(state(), {
      method: 'POST',
      path: '/api/v1/users/login',
      body: { contactEmail: 'mel@booqi.com', password: 'mel-pass' },
    })
    expect(reply).toEqual({ status: 200, json: customer })
  })

  it.each([
    ['wrong password', { contactEmail: 'mel@booqi.com', password: 'admin-pass' }],
    ['unknown email', { contactEmail: 'nadie@booqi.com', password: 'mel-pass' }],
    ['missing body', undefined],
  ])('rejects a login with %s as a 401 ProblemDetail', (_, body) => {
    const reply = send(state(), { method: 'POST', path: '/api/v1/users/login', body })
    expectProblem(reply, 401, 'Invalid email or password')
    expect(reply.json).toMatchObject({ title: 'Unauthorized', instance: '/api/v1/users/login' })
  })

  it('lists every user', () => {
    expect(send(state(), { method: 'GET', path: '/api/v1/users' })).toEqual({
      status: 200,
      json: [admin, customer],
    })
  })

  it('reads one user by id', () => {
    expect(send(state(), { method: 'GET', path: '/api/v1/users/7' })).toEqual({
      status: 200,
      json: customer,
    })
  })

  it('answers 404 for an unknown user id', () => {
    const reply = send(state(), { method: 'GET', path: '/api/v1/users/99' })
    expectProblem(reply, 404, 'User with id 99 not found')
    expect(reply.json).toMatchObject({ title: 'Not Found', instance: '/api/v1/users/99' })
  })

  it('answers 400 for a non-numeric id', () => {
    const reply = send(state(), { method: 'GET', path: '/api/v1/users/abc' })
    expectProblem(reply, 400, "Invalid value for path variable 'id'")
    expect(reply.json).toMatchObject({ title: 'Bad Request' })
  })

  it('creates a user with the next id, keeps its password for login and hides it', () => {
    const s = state()
    const reply = send(s, {
      method: 'POST',
      path: '/api/v1/users',
      body: {
        firstName: 'Ana',
        lastName: 'López',
        dateOfBirth: '2000-01-01',
        contactEmail: 'ana@booqi.com',
        password: 'ana-pass',
        role: 'CUSTOMER',
      },
    })
    const created: UserResponse = {
      id: 101,
      firstName: 'Ana',
      lastName: 'López',
      dateOfBirth: '2000-01-01',
      contactPhone: null,
      contactEmail: 'ana@booqi.com',
      role: 'CUSTOMER',
      createdAt: NOW,
      updatedAt: NOW,
    }
    expect(reply).toEqual({ status: 201, json: created })
    expect(s.users).toContainEqual(created)
    expect(s.lastId).toBe(101)
    expect(
      send(s, {
        method: 'POST',
        path: '/api/v1/users/login',
        body: { contactEmail: 'ana@booqi.com', password: 'ana-pass' },
      }).status,
    ).toBe(200)
  })

  it('keeps a phone given on creation', () => {
    const reply = send(state(), {
      method: 'POST',
      path: '/api/v1/users',
      body: { contactEmail: 'p@booqi.com', contactPhone: '+34600000000', password: 'x' },
    })
    expect(reply.json).toMatchObject({ contactPhone: '+34600000000' })
  })

  it('rejects a duplicated email with 409', () => {
    const s = state()
    const reply = send(s, {
      method: 'POST',
      path: '/api/v1/users',
      body: { contactEmail: 'mel@booqi.com', password: 'x' },
    })
    expectProblem(reply, 409, 'User with contactEmail mel@booqi.com already exists')
    expect(reply.json).toMatchObject({ title: 'Conflict' })
    expect(s.users).toHaveLength(2)
  })

  it('applies only the non-null fields of an update and can change the password', () => {
    const s = state()
    const reply = send(s, {
      method: 'PUT',
      path: '/api/v1/users/7',
      body: { firstName: 'Melania', lastName: null, password: 'nueva' },
    })
    const updated = { ...customer, firstName: 'Melania', updatedAt: NOW }
    expect(reply).toEqual({ status: 200, json: updated })
    expect(s.users[1]).toEqual(updated)
    const login = (password: string) =>
      send(s, {
        method: 'POST',
        path: '/api/v1/users/login',
        body: { contactEmail: 'mel@booqi.com', password },
      }).status
    expect(login('nueva')).toBe(200)
    expect(login('mel-pass')).toBe(401)
  })

  it('moves the stored password when the email changes', () => {
    const s = state()
    send(s, { method: 'PUT', path: '/api/v1/users/7', body: { contactEmail: 'mel2@booqi.com' } })
    const reply = send(s, {
      method: 'POST',
      path: '/api/v1/users/login',
      body: { contactEmail: 'mel2@booqi.com', password: 'mel-pass' },
    })
    expect(reply.status).toBe(200)
  })

  it('deletes a user with 204 and no body', () => {
    const s = state()
    expect(send(s, { method: 'DELETE', path: '/api/v1/users/7' })).toEqual({ status: 204 })
    expect(s.users.map((user) => user.id)).toEqual([1])
  })

  it.each(['PUT', 'DELETE'])('answers 404 to %s on an unknown user', (method) => {
    expectProblem(
      send(state(), { method, path: '/api/v1/users/99', body: {} }),
      404,
      'User with id 99 not found',
    )
  })
})

describe('events', () => {
  it('lists every event', () => {
    expect(send(state(), { method: 'GET', path: '/api/v1/events' })).toEqual({
      status: 200,
      json: [jazzEvent, rockEvent, foodEvent],
    })
  })

  it('reads one event or answers 404', () => {
    expect(send(state(), { method: 'GET', path: '/api/v1/events/7' }).json).toEqual(rockEvent)
    expectProblem(
      send(state(), { method: 'GET', path: '/api/v1/events/5' }),
      404,
      'Event with id 5 not found',
    )
  })

  it('creates an event with null optional fields and timestamps', () => {
    const s = state()
    const body = {
      title: 'Nuevo',
      availableTickets: 10,
      location: 'Bilbao',
      startDate: '2031-05-01T20:00:00',
      endDate: '2031-05-01T22:00:00',
      organizer: 'Org',
      price: 5,
      category: 'Arte',
      contactEmail: 'org@booqi.com',
      contactPhone: '+34600000000',
    }
    const expected: EventResponse = {
      ...body,
      id: 101,
      description: null,
      imageUrl: null,
      createdAt: NOW,
      updatedAt: NOW,
    }
    expect(send(s, { method: 'POST', path: '/api/v1/events', body })).toEqual({
      status: 201,
      json: expected,
    })
    expect(s.events.at(-1)).toEqual(expected)
  })

  it('keeps description and image given on creation', () => {
    const reply = send(state(), {
      method: 'POST',
      path: '/api/v1/events',
      body: { title: 'X', description: 'Algo', imageUrl: 'img.png' },
    })
    expect(reply.json).toMatchObject({ description: 'Algo', imageUrl: 'img.png' })
  })

  it('updates only the non-null fields of an event', () => {
    const s = state()
    const reply = send(s, {
      method: 'PUT',
      path: '/api/v1/events/4',
      body: { price: 20, title: null },
    })
    expect(reply).toEqual({ status: 200, json: { ...jazzEvent, price: 20, updatedAt: NOW } })
  })

  it('deletes an event', () => {
    const s = state()
    expect(send(s, { method: 'DELETE', path: '/api/v1/events/4' })).toEqual({ status: 204 })
    expect(s.events.map((event) => event.id)).toEqual([7, 9])
  })

  it.each(['PUT', 'DELETE'])('answers 404 to %s on an unknown event', (method) => {
    expectProblem(
      send(state(), { method, path: '/api/v1/events/5', body: {} }),
      404,
      'Event with id 5 not found',
    )
  })
})

function withBooking(overrides: Partial<BookingResponse> = {}): MockState {
  const s = state()
  send(s, {
    method: 'POST',
    path: '/api/v1/bookings',
    body: { userId: 7, eventId: 4, ticketQuantity: 2 },
  })
  Object.assign(s.bookings[0]!, overrides)
  return s
}

describe('bookings', () => {
  it('creates a pending booking with a snapshot of user and event and does not touch stock', () => {
    const s = state()
    const reply = send(s, {
      method: 'POST',
      path: '/api/v1/bookings',
      body: { userId: 7, eventId: 4, ticketQuantity: 3 },
    })
    const expected: BookingResponse = {
      id: 101,
      userId: 7,
      userFirstName: 'Mel',
      userLastName: 'García',
      userEmail: 'mel@booqi.com',
      eventId: 4,
      eventTitle: jazzEvent.title,
      eventDescription: jazzEvent.description,
      eventStartDate: jazzEvent.startDate,
      eventLocation: jazzEvent.location,
      ticketQuantity: 3,
      basePrice: 12.5,
      totalPrice: 37.5,
      status: 'PENDING',
      createdAt: NOW,
      updatedAt: NOW,
    }
    expect(reply).toEqual({ status: 201, json: expected })
    expect(s.bookings).toEqual([expected])
    expect(s.events[0]!.availableTickets).toBe(jazzEvent.availableTickets)
  })

  it('answers 404 when the user does not exist', () => {
    expectProblem(
      send(state(), {
        method: 'POST',
        path: '/api/v1/bookings',
        body: { userId: 99, eventId: 4, ticketQuantity: 1 },
      }),
      404,
      'User with id 99 not found',
    )
  })

  it('answers 404 when the event does not exist', () => {
    const s = state()
    expectProblem(
      send(s, {
        method: 'POST',
        path: '/api/v1/bookings',
        body: { userId: 7, eventId: 5, ticketQuantity: 1 },
      }),
      404,
      'Event with id 5 not found',
    )
    expect(s.bookings).toEqual([])
  })

  it('lists all bookings or only those of one user', () => {
    const s = withBooking()
    s.bookings.push({ ...s.bookings[0]!, id: 500, userId: 1 })
    expect(send(s, { method: 'GET', path: '/api/v1/bookings' }).json).toHaveLength(2)
    const mine = send(s, {
      method: 'GET',
      path: '/api/v1/bookings',
      query: new URLSearchParams({ userId: '7' }),
    })
    expect(mine).toEqual({ status: 200, json: [s.bookings[0]] })
  })

  it('reads one booking or answers 404', () => {
    const s = withBooking()
    expect(send(s, { method: 'GET', path: '/api/v1/bookings/101' })).toEqual({
      status: 200,
      json: s.bookings[0],
    })
    expectProblem(
      send(s, { method: 'GET', path: '/api/v1/bookings/5' }),
      404,
      'Booking with id 5 not found',
    )
  })

  it.each([
    ['cancel', 'CANCELLED'],
    ['confirm', 'CONFIRMED'],
  ])('%s sets the booking status', (action, status) => {
    const s = withBooking()
    const reply = send(s, { method: 'PATCH', path: `/api/v1/bookings/101/${action}` })
    expect(reply).toEqual({ status: 200, json: { ...s.bookings[0], status } })
    expect(s.bookings[0]).toMatchObject({ status, updatedAt: NOW })
  })

  it('answers 404 when cancelling an unknown booking', () => {
    expectProblem(
      send(state(), { method: 'PATCH', path: '/api/v1/bookings/5/cancel' }),
      404,
      'Booking with id 5 not found',
    )
  })
})

function pay(s: MockState, overrides: Record<string, unknown> = {}) {
  return send(s, {
    method: 'POST',
    path: '/api/v1/payments',
    body: {
      bookingId: 101,
      userId: 7,
      eventId: 4,
      ticketQuantity: 2,
      totalPrice: 25,
      paymentMethod: 'CREDIT_CARD',
      cardNumber: '4111111111111112',
      cvv: '123',
      ...overrides,
    },
  })
}

describe('payments', () => {
  it('approves an even card: confirms the booking and takes the stock', () => {
    const s = withBooking()
    const reply = pay(s)
    const payment: PaymentResponse = {
      id: 102,
      bookingId: 101,
      userId: 7,
      eventId: 4,
      ticketQuantity: 2,
      totalPrice: 25,
      paymentMethod: 'CREDIT_CARD',
      status: 'APPROVED',
      transactionId: UUID,
      errorMessage: null,
      paymentDate: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    }
    expect(reply).toEqual({ status: 201, json: payment })
    expect(s.payments).toEqual([payment])
    expect(s.bookings[0]!.status).toBe('CONFIRMED')
    expect(s.events[0]!.availableTickets).toBe(jazzEvent.availableTickets - 2)
  })

  it.each([undefined, ''])('approves a payment without card number (%s)', (cardNumber) => {
    expect(pay(withBooking(), { cardNumber }).json).toMatchObject({ status: 'APPROVED' })
  })

  it('rejects an odd card: cancels the booking and keeps the stock', () => {
    const s = withBooking()
    const reply = pay(s, { cardNumber: '4111111111111111' })
    expect(reply.status).toBe(201)
    expect(reply.json).toMatchObject({
      status: 'REJECTED',
      transactionId: null,
      errorMessage: 'Payment rejected by simulation',
      paymentDate: null,
    })
    expect(s.bookings[0]!.status).toBe('CANCELLED')
    expect(s.events[0]!.availableTickets).toBe(jazzEvent.availableTickets)
  })

  it('approves when buying exactly the remaining stock', () => {
    const s = withBooking()
    s.events[0]!.availableTickets = 2
    expect(pay(s).json).toMatchObject({ status: 'APPROVED' })
    expect(s.events[0]!.availableTickets).toBe(0)
  })

  it('rejects when buying one ticket more than the remaining stock', () => {
    const s = withBooking()
    s.events[0]!.availableTickets = 1
    expect(pay(s).json).toMatchObject({
      status: 'REJECTED',
      transactionId: null,
      errorMessage: 'Insufficient stock for event 4: available 1, requested 2',
    })
    expect(s.bookings[0]!.status).toBe('CANCELLED')
    expect(s.events[0]!.availableTickets).toBe(1)
  })

  it('rejects an approved card when the event no longer exists', () => {
    const s = withBooking()
    expect(pay(s, { eventId: 5 }).json).toMatchObject({
      status: 'REJECTED',
      errorMessage: 'Event with id 5 not found',
    })
    expect(s.bookings[0]!.status).toBe('CANCELLED')
  })

  it('rejects when the booking does not exist, after taking the stock', () => {
    const s = state()
    expect(pay(s).json).toMatchObject({
      status: 'REJECTED',
      errorMessage: 'Booking with id 101 not found',
    })
    expect(s.events[0]!.availableTickets).toBe(jazzEvent.availableTickets - 2)
  })

  it('accepts the maximum total price', () => {
    expect(pay(withBooking(), { totalPrice: MAX_TOTAL_PRICE }).status).toBe(201)
  })

  it('rejects a total price over the maximum with 422 and stores nothing', () => {
    const s = withBooking()
    const reply = pay(s, { totalPrice: 100000000 })
    expectProblem(reply, 422, 'Total price must not exceed 99999999.99')
    expect(reply.json).toMatchObject({ title: 'Unprocessable Entity' })
    expect(s.payments).toEqual([])
    expect(s.bookings[0]!.status).toBe('PENDING')
  })

  it('lists payments', () => {
    const s = withBooking()
    pay(s)
    expect(send(s, { method: 'GET', path: '/api/v1/payments' })).toEqual({
      status: 200,
      json: s.payments,
    })
  })
})

describe('unknown routes', () => {
  it.each([
    ['GET', '/api/v1/tickets'],
    ['PATCH', '/api/v1/events'],
    ['POST', '/api/v1/payments/3'],
    ['GET', '/api/v1/bookings/101/cancel'],
    ['GET', '/api/v1/users/login'],
    ['DELETE', '/api/v1/users'],
    ['PATCH', '/api/v1/users/7'],
    ['PATCH', '/api/v1/events/4'],
    ['DELETE', '/api/v1/bookings'],
    ['POST', '/api/v1/bookings/101'],
    ['PATCH', '/api/v1/bookings/101/archive'],
    ['DELETE', '/api/v1/payments'],
  ])('%s %s answers a 404 ProblemDetail', (method, path) => {
    expectProblem(send(withBooking(), { method, path }), 404, `No mock for ${method} ${path}`)
  })
})

describe('path ids', () => {
  it.each(['/api/v1/users/7x', '/api/v1/users/x7', '/api/v1/events/login'])(
    '%s is a 400 ProblemDetail',
    (path) => {
      expectProblem(
        send(state(), { method: 'GET', path }),
        400,
        "Invalid value for path variable 'id'",
      )
    },
  )
})

describe('payments touch only their own booking', () => {
  function twoBookings() {
    const s = withBooking()
    send(s, {
      method: 'POST',
      path: '/api/v1/bookings',
      body: { userId: 7, eventId: 4, ticketQuantity: 2 },
    })
    return s
  }

  it.each([
    ['4111111111111112', 'CONFIRMED'],
    ['4111111111111111', 'CANCELLED'],
  ])('card %s settles only the paid booking as %s', (cardNumber, status) => {
    const s = twoBookings()
    pay(s, { bookingId: 102, cardNumber })
    expect(s.bookings.map((booking) => booking.status)).toEqual(['PENDING', status])
  })
})

describe('defaults', () => {
  it('formats the system time as a local timestamp with padded fields', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2031, 0, 5, 3, 4, 5))
    try {
      const reply = handleMockRequest(state(), {
        method: 'POST',
        path: '/api/v1/events',
        body: { title: 'X' },
      })
      expect(reply.json).toMatchObject({ createdAt: '2031-01-05T03:04:05' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('stamps the current local time and a random UUID when no clock is given', () => {
    const s = withBooking()
    const reply = handleMockRequest(s, {
      method: 'POST',
      path: '/api/v1/payments',
      body: { bookingId: 101, userId: 7, eventId: 4, ticketQuantity: 1, totalPrice: 1 },
    })
    expect(reply.json).toMatchObject({
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/),
      transactionId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    })
  })
})
