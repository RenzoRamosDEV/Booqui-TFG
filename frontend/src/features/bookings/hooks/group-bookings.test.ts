import { bookingWith } from '../../../test/fixtures/bookings'
import {
  bookingStatusLabel,
  bookingStatusTone,
  groupBookingsByEvent,
  groupStatus,
} from './group-bookings'

describe('groupBookingsByEvent', () => {
  const jazzA = bookingWith({
    id: 42,
    eventId: 4,
    ticketQuantity: 2,
    totalPrice: 25,
    createdAt: '2030-01-01T10:00:00',
  })
  const jazzB = bookingWith({
    id: 43,
    eventId: 4,
    ticketQuantity: 1,
    totalPrice: 12.5,
    createdAt: '2030-01-02T10:00:00',
  })
  const rock = bookingWith({
    id: 50,
    eventId: 7,
    eventTitle: 'Rock en Madrid',
    eventStartDate: '2030-12-01T20:00:00',
    eventLocation: 'WiZink Center, Madrid',
    ticketQuantity: 1,
    totalPrice: 30,
  })

  it('groups bookings by event with the event data', () => {
    const groups = groupBookingsByEvent([jazzA, rock, jazzB])

    expect(
      groups.map((group) => [group.eventId, group.bookings.map((booking) => booking.id)]),
    ).toEqual([
      [7, [50]],
      [4, [43, 42]],
    ])
    expect(groups[1]).toMatchObject({
      eventTitle: 'Jazz en Madrid',
      eventStartDate: '2030-11-10T21:00:00',
      eventLocation: 'IFEMA, Madrid',
    })
  })

  it('orders groups by event start date, most recent first', () => {
    const early = bookingWith({ id: 1, eventId: 1, eventStartDate: '2029-01-01T10:00:00' })
    const late = bookingWith({ id: 2, eventId: 2, eventStartDate: '2031-01-01T10:00:00' })

    expect(groupBookingsByEvent([early, late]).map((group) => group.eventId)).toEqual([2, 1])
  })

  it('orders bookings inside a group by creation, newest first', () => {
    expect(groupBookingsByEvent([jazzA, jazzB])[0]!.bookings.map((booking) => booking.id)).toEqual([
      43, 42,
    ])
  })

  it('totals tickets and amount excluding cancelled bookings', () => {
    const cancelled = bookingWith({
      id: 44,
      eventId: 4,
      ticketQuantity: 5,
      totalPrice: 62.5,
      status: 'CANCELLED',
    })

    const [group] = groupBookingsByEvent([jazzA, jazzB, cancelled])

    expect(group).toMatchObject({ totalTickets: 3, totalCents: 3750 })
  })

  it('totals zero for a fully cancelled group', () => {
    const [group] = groupBookingsByEvent([bookingWith({ status: 'CANCELLED' })])

    expect(group).toMatchObject({ totalTickets: 0, totalCents: 0, status: 'CANCELLED' })
  })

  it('returns no groups without bookings', () => {
    expect(groupBookingsByEvent([])).toEqual([])
  })
})

describe('groupStatus', () => {
  const status = (...statuses: Array<'PENDING' | 'CONFIRMED' | 'CANCELLED'>) =>
    groupStatus(statuses.map((value, index) => bookingWith({ id: index, status: value })))

  it.each([
    [['CONFIRMED', 'CONFIRMED'], 'CONFIRMED'],
    [['CANCELLED', 'CANCELLED'], 'CANCELLED'],
    [['CONFIRMED', 'CANCELLED'], 'PENDING'],
    [['PENDING', 'CONFIRMED'], 'PENDING'],
    [['PENDING'], 'PENDING'],
    [['CONFIRMED'], 'CONFIRMED'],
  ] as const)('%j → %s', (statuses, expected) => {
    expect(status(...statuses)).toBe(expected)
  })
})

describe('status labels', () => {
  it.each([
    ['CONFIRMED', 'Confirmada', 'success'],
    ['PENDING', 'Pendiente', 'warning'],
    ['CANCELLED', 'Cancelada', 'danger'],
  ] as const)('%s → %s (%s)', (status, label, tone) => {
    expect(bookingStatusLabel(status)).toBe(label)
    expect(bookingStatusTone(status)).toBe(tone)
  })
})
