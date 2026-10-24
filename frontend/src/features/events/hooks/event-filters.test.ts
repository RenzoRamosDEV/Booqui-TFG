import { eventWith } from '../../../test/fixtures/events'
import type { EventResponse } from '../../../types/event'
import {
  PAGE_SIZE,
  applyEventFilters,
  paginate,
  parseEventFilters,
  parseMaxPrice,
  serializeEventFilters,
  type EventFilters,
} from './event-filters'

const params = (query: string) => new URLSearchParams(query)

describe('parseEventFilters', () => {
  it('reads every valid value', () => {
    expect(
      parseEventFilters(
        params(
          'q=jazz&category=Música&city=madrid&from=2030-11-01&to=2030-11-30&maxPrice=30&page=2',
        ),
      ),
    ).toEqual({
      q: 'jazz',
      category: 'Música',
      city: 'madrid',
      from: '2030-11-01',
      to: '2030-11-30',
      maxPrice: 30,
      page: 2,
    })
  })

  it('defaults to page 1 and no filters', () => {
    expect(parseEventFilters(params(''))).toEqual({ page: 1 })
  })

  it.each(['q', 'category', 'city'])('drops an empty or blank %s', (key) => {
    expect(parseEventFilters(params(`${key}=%20%20`))).toEqual({ page: 1 })
    expect(parseEventFilters(params(`${key}=`))).toEqual({ page: 1 })
  })

  it('trims text values', () => {
    expect(parseEventFilters(params('q=%20rock%20&city=%20Madrid'))).toEqual({
      q: 'rock',
      city: 'Madrid',
      page: 1,
    })
  })

  it.each([
    ['abc', undefined],
    ['-1', undefined],
    ['-0.01', undefined],
    ['', undefined],
    ['Infinity', undefined],
    ['0', 0],
    ['12.5', 12.5],
  ])('maxPrice=%s → %s', (value, expected) => {
    expect(parseEventFilters(params(`maxPrice=${value}`)).maxPrice).toBe(expected)
  })

  it.each([
    ['2030-11-10', '2030-11-10'],
    ['2030-02-30', undefined],
    ['2030-13-01', undefined],
    ['10/11/2030', undefined],
    ['2030-11-10T10:00', undefined],
    ['mañana', undefined],
  ])('from=%s → %s', (value, expected) => {
    expect(parseEventFilters(params(`from=${value}`)).from).toBe(expected)
    expect(parseEventFilters(params(`to=${value}`)).to).toBe(expected)
  })

  it.each([
    ['0', 1],
    ['-1', 1],
    ['abc', 1],
    ['1.5', 1],
    ['1', 1],
    ['2', 2],
    ['9', 9],
  ])('page=%s → %i', (value, page) => {
    expect(parseEventFilters(params(`page=${value}`)).page).toBe(page)
  })
})

describe('parseMaxPrice', () => {
  it.each([
    ['20', 20],
    ['0', 0],
    [' 7.5 ', 7.5],
    ['   ', undefined],
    ['', undefined],
    ['-1', undefined],
    ['abc', undefined],
    [null, undefined],
  ])('%j → %s', (value, expected) => {
    expect(parseMaxPrice(value)).toBe(expected)
  })
})

describe('serializeEventFilters', () => {
  it('omits defaults and page 1', () => {
    expect(serializeEventFilters({ page: 1 }).toString()).toBe('')
  })

  it('writes every value in a stable order', () => {
    const filters: EventFilters = {
      page: 2,
      maxPrice: 30,
      to: '2030-11-30',
      from: '2030-11-01',
      city: 'madrid',
      category: 'Arte',
      q: 'rock',
    }

    expect(serializeEventFilters(filters).toString()).toBe(
      'q=rock&category=Arte&city=madrid&from=2030-11-01&to=2030-11-30&maxPrice=30&page=2',
    )
  })

  it('keeps a maxPrice of 1, which is not the page default', () => {
    expect(serializeEventFilters({ page: 1, maxPrice: 1 }).toString()).toBe('maxPrice=1')
  })

  it('keeps a free maxPrice of 0', () => {
    expect(serializeEventFilters({ page: 1, maxPrice: 0 }).toString()).toBe('maxPrice=0')
  })

  it('drops empty text values', () => {
    expect(serializeEventFilters({ page: 1, q: '', city: '' }).toString()).toBe('')
  })

  it('round-trips through parse', () => {
    const filters: EventFilters = { q: 'rock', category: 'Música', maxPrice: 20, page: 3 }

    expect(parseEventFilters(serializeEventFilters(filters))).toEqual(filters)
  })
})

describe('applyEventFilters', () => {
  const jazz = eventWith({
    id: 1,
    title: 'Jazz en Madrid',
    description: 'Cuartetos en directo',
    category: 'Música',
    location: 'IFEMA, Madrid',
    price: 20,
    startDate: '2030-11-10T21:00:00',
  })
  const rock = eventWith({
    id: 2,
    title: 'Rock en Madrid',
    description: 'Guitarras',
    category: 'Música',
    location: 'WiZink, Madrid',
    price: 45,
    startDate: '2030-11-09T20:00:00',
  })
  const food = eventWith({
    id: 3,
    title: 'Gastronomía local',
    description: null,
    organizer: 'Sabores',
    category: 'Gastronomía',
    location: 'Sevilla',
    price: 0,
    startDate: '2030-11-11T12:00:00',
  })
  const all: EventResponse[] = [jazz, rock, food]
  const ids = (events: EventResponse[]) => events.map((event) => event.id)

  it('returns every event sorted by start date without filters', () => {
    expect(ids(applyEventFilters(all, { page: 1 }))).toEqual([2, 1, 3])
  })

  it('does not reorder the input array', () => {
    const input = [...all]
    applyEventFilters(input, { page: 1 })

    expect(ids(input)).toEqual([1, 2, 3])
  })

  it('combines category, city and maxPrice with AND', () => {
    expect(
      ids(applyEventFilters(all, { category: 'Música', city: 'madrid', maxPrice: 30, page: 1 })),
    ).toEqual([1])
  })

  it('matches text ignoring case and accents', () => {
    expect(ids(applyEventFilters(all, { q: 'gastronomia', page: 1 }))).toEqual([3])
    expect(ids(applyEventFilters(all, { q: 'JAZZ', page: 1 }))).toEqual([1])
  })

  it('matches text in the description and the organizer', () => {
    const described = eventWith({ id: 5, title: 'Noche', description: 'Concierto de blues' })
    const organized = eventWith({ id: 6, title: 'Tarde', description: null, organizer: 'Blues SL' })

    expect(ids(applyEventFilters([described, organized, jazz], { q: 'blues', page: 1 }))).toEqual([
      5, 6,
    ])
  })

  it('matches the category exactly, ignoring case and accents', () => {
    expect(ids(applyEventFilters(all, { category: 'musica', page: 1 }))).toEqual([2, 1])
    expect(ids(applyEventFilters(all, { category: 'Músic', page: 1 }))).toEqual([])
  })

  it('matches the city inside the location', () => {
    expect(ids(applyEventFilters(all, { city: 'sevilla', page: 1 }))).toEqual([3])
  })

  it('treats the date range as inclusive on the start day', () => {
    expect(ids(applyEventFilters(all, { from: '2030-11-10', to: '2030-11-10', page: 1 }))).toEqual([
      1,
    ])
    expect(ids(applyEventFilters(all, { from: '2030-11-10', page: 1 }))).toEqual([1, 3])
    expect(ids(applyEventFilters(all, { to: '2030-11-10', page: 1 }))).toEqual([2, 1])
  })

  it('includes the event whose price equals maxPrice', () => {
    expect(ids(applyEventFilters(all, { maxPrice: 20, page: 1 }))).toEqual([1, 3])
    expect(ids(applyEventFilters(all, { maxPrice: 19.99, page: 1 }))).toEqual([3])
  })

  it('keeps free events with maxPrice 0', () => {
    expect(ids(applyEventFilters(all, { maxPrice: 0, page: 1 }))).toEqual([3])
  })
})

describe('paginate', () => {
  const items = (count: number) => Array.from({ length: count }, (_, index) => index + 1)

  it('uses 12 items per page', () => {
    expect(PAGE_SIZE).toBe(12)
  })

  it('returns one empty page for no items', () => {
    expect(paginate([], 1)).toEqual({ items: [], page: 1, totalPages: 1 })
  })

  it('fits exactly 12 items in one page', () => {
    expect(paginate(items(12), 1)).toEqual({ items: items(12), page: 1, totalPages: 1 })
  })

  it('starts a second page at 13 items', () => {
    expect(paginate(items(13), 2)).toEqual({ items: [13], page: 2, totalPages: 2 })
  })

  it('shows items 13 to 24 on page 2 of 30', () => {
    const result = paginate(items(30), 2)

    expect(result.items).toEqual(items(24).slice(12))
    expect(result.totalPages).toBe(3)
  })

  it.each([
    [9, 3],
    [4, 3],
    [3, 3],
    [0, 1],
    [-2, 1],
  ])('clamps page %i of 30 items to %i', (page, expected) => {
    const result = paginate(items(30), page)

    expect(result.page).toBe(expected)
    expect(result.items[0]).toBe((expected - 1) * 12 + 1)
  })
})
