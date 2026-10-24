import { bookingWith, jazzBooking } from '../../../test/fixtures/bookings'
import { ticketFileName, ticketPages } from './ticket-content'

describe('ticketPages', () => {
  it('builds one page per ticket of a booking (golden)', () => {
    expect(ticketPages([jazzBooking])).toEqual(
      [1, 2, 3].map((number) => ({
        bookingId: 42,
        code: '42',
        qrText: '42',
        eventTitle: 'Jazz en Madrid',
        eventDate: 'domingo, 10 de noviembre de 2030, 21:00',
        eventLocation: 'IFEMA, Madrid',
        buyerName: 'Mel García',
        ticketLabel: `${number} / 3`,
      })),
    )
  })

  it('numbers the tickets of each booking separately', () => {
    const pages = ticketPages([
      bookingWith({ id: 42, ticketQuantity: 2 }),
      bookingWith({ id: 43, ticketQuantity: 1 }),
    ])

    expect(pages.map((page) => [page.code, page.ticketLabel])).toEqual([
      ['42', '1 / 2'],
      ['42', '2 / 2'],
      ['43', '1 / 1'],
    ])
  })

  it('skips cancelled bookings', () => {
    const pages = ticketPages([
      bookingWith({ id: 42, ticketQuantity: 2, status: 'CONFIRMED' }),
      bookingWith({ id: 43, ticketQuantity: 4, status: 'CANCELLED' }),
    ])

    expect(pages).toHaveLength(2)
    expect(pages.every((page) => page.bookingId === 42)).toBe(true)
  })

  it('includes pending bookings', () => {
    expect(ticketPages([bookingWith({ status: 'PENDING', ticketQuantity: 1 })])).toHaveLength(1)
  })

  it('returns no pages when every booking is cancelled', () => {
    expect(ticketPages([bookingWith({ status: 'CANCELLED' })])).toEqual([])
    expect(ticketPages([])).toEqual([])
  })
})

describe('ticketFileName', () => {
  it('derives the name from the event title and booking id', () => {
    expect(ticketFileName([jazzBooking])).toBe('booqi-jazz-en-madrid-42.pdf')
  })

  it('joins the ids of the bookings that produce tickets', () => {
    expect(
      ticketFileName([
        bookingWith({ id: 42 }),
        bookingWith({ id: 43, status: 'CANCELLED' }),
        bookingWith({ id: 44 }),
      ]),
    ).toBe('booqi-jazz-en-madrid-42-44.pdf')
  })

  it('uses a generic name when no booking produces tickets', () => {
    expect(ticketFileName([bookingWith({ status: 'CANCELLED' })])).toBe('booqi-entradas.pdf')
    expect(ticketFileName([])).toBe('booqi-entradas.pdf')
  })

  it('falls back to a generic name for a title without letters', () => {
    expect(ticketFileName([bookingWith({ eventTitle: '???' })])).toBe('booqi-entradas-42.pdf')
  })
})
