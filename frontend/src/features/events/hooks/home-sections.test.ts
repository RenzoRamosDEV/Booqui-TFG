import { eventWith } from '../../../test/fixtures/events'
import { homeSections } from './home-sections'

const now = new Date('2030-06-01T12:00:00')

function upcoming(count: number, firstId = 1) {
  return Array.from({ length: count }, (_, index) =>
    eventWith({
      id: firstId + index,
      startDate: `2030-07-${String(index + 1).padStart(2, '0')}T20:00:00`,
      availableTickets: 10,
    }),
  )
}

const ids = (events: { id: number }[]) => events.map((event) => event.id)

describe('homeSections', () => {
  it('splits upcoming events into 3 featured and the next 6', () => {
    const sections = homeSections(upcoming(12), now)

    expect(ids(sections.featured)).toEqual([1, 2, 3])
    expect(ids(sections.upcoming)).toEqual([4, 5, 6, 7, 8, 9])
  })

  it('orders by start date regardless of input order', () => {
    const sections = homeSections(upcoming(4).reverse(), now)

    expect(ids(sections.featured)).toEqual([1, 2, 3])
    expect(ids(sections.upcoming)).toEqual([4])
  })

  it('excludes events that already started', () => {
    const past = eventWith({ id: 99, startDate: '2030-06-01T11:59:59' })
    const atNow = eventWith({ id: 98, startDate: '2030-06-01T12:00:00' })

    const sections = homeSections([past, atNow, ...upcoming(1)], now)

    expect(ids([...sections.featured, ...sections.upcoming])).toEqual([1])
  })

  it('keeps sold-out events out of featured but lists them as upcoming', () => {
    const [first, second, third, fourth] = upcoming(4)
    const soldOut = { ...first!, availableTickets: 0 }

    const sections = homeSections([soldOut, second!, third!, fourth!], now)

    expect(ids(sections.featured)).toEqual([2, 3, 4])
    expect(ids(sections.upcoming)).toEqual([1])
  })

  it('shows only what exists when there are fewer events than slots', () => {
    const sections = homeSections(upcoming(2), now)

    expect(ids(sections.featured)).toEqual([1, 2])
    expect(sections.upcoming).toEqual([])
  })

  it('returns empty sections without events', () => {
    expect(homeSections([], now)).toEqual({ featured: [], upcoming: [] })
  })
})
