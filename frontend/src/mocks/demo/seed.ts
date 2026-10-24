// MOCK: estado inicial de la demo de GitHub Pages, que no tiene backend: cuentas, catálogo con fechas
// futuras y algunas ventas ya hechas para que «Mis reservas» y el panel de admin no salgan vacíos.
import type { BookingResponse } from '../../types/booking'
import type { EventResponse } from '../../types/event'
import type { PaymentResponse } from '../../types/payment'
import type { Role, UserResponse } from '../../types/user'
import { localTimestamp, type MockState } from '../mock-backend'
import { DEMO_CUSTOMER_NAMES, DEMO_EVENTS } from './catalogue'

export type DemoAccount = { role: Role; label: string; email: string; password: string }

export const DEMO_ACCOUNTS = [
  { role: 'CUSTOMER', label: 'cliente', email: 'cliente@booqi.demo', password: 'demo1234' },
  { role: 'ADMIN', label: 'admin', email: 'admin@booqi.demo', password: 'demo1234' },
] as const satisfies readonly DemoAccount[]

function shiftedDate(now: Date, inDays: number, hour: number, minute = 0): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + inDays, hour, minute)
}

function user(
  id: number,
  [firstName, lastName]: readonly [string, string],
  email: string,
  role: Role,
  createdAt: string,
): UserResponse {
  return {
    id,
    firstName,
    lastName,
    dateOfBirth: '1994-03-18',
    contactPhone: null,
    contactEmail: email,
    role,
    createdAt,
    updatedAt: createdAt,
  }
}

export function createDemoState(now: Date): MockState {
  const past = localTimestamp(shiftedDate(now, -30, 10))
  const [customerAccount, adminAccount] = DEMO_ACCOUNTS
  const [customerName, adminName, otherName] = DEMO_CUSTOMER_NAMES
  const users = [
    user(1, customerName, customerAccount.email, 'CUSTOMER', past),
    user(2, adminName, adminAccount.email, 'ADMIN', past),
    user(3, otherName, 'begona@booqi.demo', 'CUSTOMER', past),
  ]
  const events: EventResponse[] = DEMO_EVENTS.map(
    ({ inDays, hour, minute, hours, ...event }, index) => ({
      ...event,
      id: 101 + index,
      startDate: localTimestamp(shiftedDate(now, inDays, hour, minute)),
      endDate: localTimestamp(shiftedDate(now, inDays, hour + hours, minute)),
      contactPhone: '+34910000000',
      imageUrl: null,
      createdAt: past,
      updatedAt: past,
    }),
  )
  const sales: Array<[number, UserResponse, EventResponse, number]> = [
    [201, users[0]!, events[5]!, 2],
    [202, users[2]!, events[1]!, 4],
    [203, users[2]!, events[3]!, 1],
  ]
  const bookings: BookingResponse[] = sales.map(([id, buyer, event, quantity]) => ({
    id,
    userId: buyer.id,
    userFirstName: buyer.firstName,
    userLastName: buyer.lastName,
    userEmail: buyer.contactEmail,
    eventId: event.id,
    eventTitle: event.title,
    eventDescription: event.description,
    eventStartDate: event.startDate,
    eventLocation: event.location,
    ticketQuantity: quantity,
    basePrice: event.price,
    totalPrice: event.price * quantity,
    status: 'CONFIRMED',
    createdAt: past,
    updatedAt: past,
  }))
  const payments: PaymentResponse[] = bookings.map((booking, index) => ({
    id: 301 + index,
    bookingId: booking.id,
    userId: booking.userId,
    eventId: booking.eventId,
    ticketQuantity: booking.ticketQuantity,
    totalPrice: booking.totalPrice,
    paymentMethod: 'CREDIT_CARD',
    status: 'APPROVED',
    transactionId: `00000000-0000-4000-8000-00000000030${index + 1}`,
    errorMessage: null,
    paymentDate: past,
    createdAt: past,
    updatedAt: past,
  }))
  return {
    users,
    events,
    bookings,
    payments,
    passwords: Object.fromEntries(
      DEMO_ACCOUNTS.map((account) => [account.email, account.password]),
    ),
    lastId: 1000,
  }
}
