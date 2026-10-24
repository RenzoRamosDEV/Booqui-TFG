import { bookingWith } from '../../../test/fixtures/bookings'
import { paymentWith } from '../../../test/fixtures/payments'
import { buildSalesRows, filterSalesRows, salesTotals, type SalesRow } from './sales'

const jazzBooking = bookingWith({ id: 42, eventId: 4, status: 'CONFIRMED' })
const rockBooking = bookingWith({
  id: 50,
  eventId: 7,
  eventTitle: 'Rock en Madrid',
  userFirstName: 'Ana',
  userLastName: 'López',
  userEmail: 'ana@booqi.com',
  status: 'CANCELLED',
})

describe('buildSalesRows', () => {
  it('joins each payment with its booking', () => {
    const payment = paymentWith({
      id: 100,
      bookingId: 42,
      eventId: 4,
      ticketQuantity: 3,
      totalPrice: 37.5,
    })

    expect(buildSalesRows([payment], [jazzBooking, rockBooking])).toEqual([
      {
        paymentId: 100,
        bookingId: 42,
        eventId: 4,
        eventTitle: 'Jazz en Madrid',
        customer: 'Mel García',
        customerEmail: 'mel@booqi.com',
        tickets: 3,
        amountCents: 3750,
        method: 'CREDIT_CARD',
        paymentStatus: 'APPROVED',
        bookingStatus: 'CONFIRMED',
        date: '2030-01-12T10:00:05',
      },
    ])
  })

  it('tolerates a payment whose booking is missing', () => {
    const [row] = buildSalesRows([paymentWith({ bookingId: 999, eventId: 9, userId: 3 })], [])

    expect(row).toMatchObject({
      eventTitle: 'Evento 9',
      customer: 'Usuario 3',
      customerEmail: '',
      bookingStatus: null,
    })
  })

  it('falls back to the creation date when there is no payment date', () => {
    const [row] = buildSalesRows(
      [paymentWith({ paymentDate: null, createdAt: '2030-01-01T09:00:00' })],
      [jazzBooking],
    )

    expect(row!.date).toBe('2030-01-01T09:00:00')
  })

  it('lists the newest payments first', () => {
    const rows = buildSalesRows(
      [
        paymentWith({ id: 1, paymentDate: '2030-01-01T10:00:00' }),
        paymentWith({ id: 2, paymentDate: '2030-03-01T10:00:00' }),
        paymentWith({ id: 3, paymentDate: '2030-02-01T10:00:00' }),
      ],
      [jazzBooking],
    )

    expect(rows.map((row) => row.paymentId)).toEqual([2, 3, 1])
  })
})

describe('filterSalesRows', () => {
  const rows: SalesRow[] = buildSalesRows(
    [
      paymentWith({ id: 1, bookingId: 42, eventId: 4, status: 'APPROVED' }),
      paymentWith({ id: 2, bookingId: 42, eventId: 4, status: 'APPROVED' }),
      paymentWith({ id: 3, bookingId: 50, eventId: 7, status: 'APPROVED' }),
      paymentWith({ id: 4, bookingId: 50, eventId: 7, status: 'REJECTED' }),
      paymentWith({ id: 5, bookingId: 50, eventId: 7, status: 'PENDING' }),
    ],
    [jazzBooking, rockBooking],
  )
  const ids = (list: SalesRow[]) => list.map((row) => row.paymentId).sort()

  it('keeps every row with no filter', () => {
    expect(ids(filterSalesRows(rows, { status: 'ALL', eventId: null }))).toEqual([1, 2, 3, 4, 5])
  })

  it.each([
    ['APPROVED', [1, 2, 3]],
    ['REJECTED', [4]],
    ['PENDING', [5]],
  ] as const)('filters by status %s', (status, expected) => {
    expect(ids(filterSalesRows(rows, { status, eventId: null }))).toEqual(expected)
  })

  it('filters by event', () => {
    expect(ids(filterSalesRows(rows, { status: 'ALL', eventId: 7 }))).toEqual([3, 4, 5])
  })

  it('combines status and event', () => {
    expect(ids(filterSalesRows(rows, { status: 'APPROVED', eventId: 7 }))).toEqual([3])
  })
})

describe('salesTotals', () => {
  it('adds the amounts per status in cents', () => {
    const rows = buildSalesRows(
      [
        paymentWith({ id: 1, totalPrice: 25, status: 'APPROVED' }),
        paymentWith({ id: 2, totalPrice: 12.5, status: 'APPROVED' }),
        paymentWith({ id: 3, totalPrice: 30, status: 'REJECTED' }),
        paymentWith({ id: 4, totalPrice: 0.1, status: 'PENDING' }),
      ],
      [],
    )

    expect(salesTotals(rows)).toEqual({
      approvedCents: 3750,
      rejectedCents: 3000,
      pendingCents: 10,
      count: 4,
    })
  })

  it('is zero for no rows', () => {
    expect(salesTotals([])).toEqual({
      approvedCents: 0,
      rejectedCents: 0,
      pendingCents: 0,
      count: 0,
    })
  })
})
