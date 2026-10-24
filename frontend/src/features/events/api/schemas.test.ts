import { jazzEvent } from '../../../test/fixtures/events'
import { eventResponseSchema } from './schemas'

describe('eventResponseSchema', () => {
  it('parses a contract example', () => {
    expect(eventResponseSchema.parse(jazzEvent)).toEqual(jazzEvent)
  })

  it('accepts null description and imageUrl', () => {
    const event = { ...jazzEvent, description: null, imageUrl: null }

    expect(eventResponseSchema.parse(event)).toEqual(event)
  })

  it('accepts a free event with fractional price', () => {
    expect(eventResponseSchema.safeParse({ ...jazzEvent, price: 0 }).success).toBe(true)
    expect(eventResponseSchema.safeParse({ ...jazzEvent, price: 12.5 }).success).toBe(true)
  })

  it.each(Object.keys(jazzEvent))('rejects an event without %s', (field) => {
    const event: Record<string, unknown> = { ...jazzEvent }
    delete event[field]

    expect(eventResponseSchema.safeParse(event).success).toBe(false)
  })

  it.each([
    ['string id', { id: '4' }],
    ['fractional id', { id: 4.5 }],
    ['numeric title', { title: 1 }],
    ['numeric description', { description: 1 }],
    ['string availableTickets', { availableTickets: '50' }],
    ['fractional availableTickets', { availableTickets: 1.5 }],
    ['numeric location', { location: 1 }],
    ['numeric startDate', { startDate: 1 }],
    ['numeric endDate', { endDate: 1 }],
    ['numeric organizer', { organizer: 1 }],
    ['string price', { price: '12.5' }],
    ['numeric category', { category: 1 }],
    ['numeric contactEmail', { contactEmail: 1 }],
    ['numeric contactPhone', { contactPhone: 1 }],
    ['numeric imageUrl', { imageUrl: 1 }],
    ['numeric createdAt', { createdAt: 1 }],
    ['null updatedAt', { updatedAt: null }],
  ])('rejects %s', (_case, patch) => {
    expect(eventResponseSchema.safeParse({ ...jazzEvent, ...patch }).success).toBe(false)
  })

  it.each([null, 'event', 42, []])('rejects %j', (value) => {
    expect(eventResponseSchema.safeParse(value).success).toBe(false)
  })
})
