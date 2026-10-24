import type { APIRequestContext, APIResponse } from '@playwright/test'

export const runId = Date.now().toString(36)

export const ADMIN = { contactEmail: 'mel@booqi.com', password: 'admin_mel' } as const

export interface Customer {
  id: number
  firstName: string
  lastName: string
  contactEmail: string
  password: string
}

export interface RealEvent {
  id: number
  title: string
  availableTickets: number
  price: number
  location: string
  contactEmail: string
}

export interface RealBooking {
  id: number
  userId: number
  eventId: number
  ticketQuantity: number
  totalPrice: number
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
}

export interface RealPayment {
  id: number
  bookingId: number
  totalPrice: number
  paymentMethod: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

let sequence = 0

function nextKey(): string {
  sequence += 1
  return `${runId}-${sequence}`
}

async function expectStatus<T>(response: APIResponse, expected: number, action: string) {
  if (response.status() !== expected) {
    throw new Error(
      `${action}: expected HTTP ${expected}, got ${response.status()}: ${await response.text()}`,
    )
  }
  return (await response.json()) as T
}

function localDateTime(date: Date): string {
  return date.toISOString().slice(0, 19)
}

export async function createCustomer(request: APIRequestContext): Promise<Customer> {
  const key = nextKey()
  const password = `e2e-pass-${key}`
  const response = await request.post('/api/v1/users', {
    data: {
      firstName: 'Ada',
      lastName: `Prueba ${key}`,
      dateOfBirth: '1995-05-20',
      contactEmail: `e2e-${key}@booqi.test`,
      password,
      role: 'CUSTOMER',
    },
  })
  const user = await expectStatus<Omit<Customer, 'password'>>(response, 201, 'create customer')
  return { ...user, password }
}

export async function createEvent(
  request: APIRequestContext,
  overrides: Partial<{ title: string; availableTickets: number; price: number }> = {},
): Promise<RealEvent> {
  const key = nextKey()
  const start = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const response = await request.post('/api/v1/events', {
    data: {
      title: `E2E ${key} Concierto`,
      description: 'Evento creado por la suite E2E contra el backend real.',
      availableTickets: 50,
      location: 'Madrid',
      startDate: localDateTime(start),
      endDate: localDateTime(end),
      organizer: 'Booqi E2E',
      price: 12.5,
      category: 'Música',
      contactEmail: `e2e-event-${key}@booqi.test`,
      contactPhone: '600000000',
      ...overrides,
    },
  })
  return expectStatus<RealEvent>(response, 201, 'create event')
}

export async function getEvent(request: APIRequestContext, id: number): Promise<RealEvent> {
  return expectStatus<RealEvent>(await request.get(`/api/v1/events/${id}`), 200, 'get event')
}

export async function getBooking(request: APIRequestContext, id: number): Promise<RealBooking> {
  return expectStatus<RealBooking>(await request.get(`/api/v1/bookings/${id}`), 200, 'get booking')
}

export async function bookingsOf(
  request: APIRequestContext,
  userId: number,
): Promise<RealBooking[]> {
  const response = await request.get('/api/v1/bookings', { params: { userId } })
  return expectStatus<RealBooking[]>(response, 200, 'list bookings')
}

export async function deleteEvent(request: APIRequestContext, id: number): Promise<void> {
  const response = await request.delete(`/api/v1/events/${id}`)
  if (response.status() !== 204) {
    throw new Error(`delete event: expected HTTP 204, got ${response.status()}`)
  }
}

export async function findEventByTitle(
  request: APIRequestContext,
  title: string,
): Promise<RealEvent | undefined> {
  const response = await request.get('/api/v1/events', { params: { title } })
  const events = await expectStatus<RealEvent[]>(response, 200, 'find event')
  return events.find((event) => event.title === title)
}

export async function statusOf(request: APIRequestContext, path: string): Promise<number> {
  return (await request.get(path)).status()
}

export async function paymentOfBooking(
  request: APIRequestContext,
  bookingId: number,
): Promise<RealPayment | undefined> {
  const payments = await expectStatus<RealPayment[]>(
    await request.get('/api/v1/payments'),
    200,
    'list payments',
  )
  return payments.find((payment) => payment.bookingId === bookingId)
}

export async function purchaseViaApi(
  request: APIRequestContext,
  customer: Customer,
  event: RealEvent,
  ticketQuantity: number,
  cardNumber: string,
): Promise<RealPayment> {
  const booking = await expectStatus<RealBooking>(
    await request.post('/api/v1/bookings', {
      data: { userId: customer.id, eventId: event.id, ticketQuantity },
    }),
    201,
    'create booking',
  )
  return expectStatus<RealPayment>(
    await request.post('/api/v1/payments', {
      data: {
        bookingId: booking.id,
        userId: customer.id,
        eventId: event.id,
        ticketQuantity,
        totalPrice: booking.totalPrice,
        paymentMethod: 'CREDIT_CARD',
        cardNumber,
      },
    }),
    201,
    'create payment',
  )
}
