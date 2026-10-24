import { ApiError } from '../../../lib/api-error'
import { installFakeApi } from '../../../test/fake-api'
import { jazzEvent, rockEvent } from '../../../test/fixtures/events'
import type { CreateEventRequest } from '../../../types/event'
import {
  createEvent,
  deleteEvent,
  eventKeys,
  getEvent,
  listEvents,
  updateEvent,
} from './events-api'

const createBody: CreateEventRequest = {
  title: 'Jazz en Madrid',
  description: 'Jazz en directo',
  availableTickets: 50,
  location: 'IFEMA, Madrid',
  startDate: '2030-11-10T21:00:00',
  endDate: '2030-11-10T23:30:00',
  organizer: 'Blue Note Madrid',
  price: 12.5,
  category: 'Música',
  contactEmail: 'jazz@booqi.com',
  contactPhone: '+34600111222',
}

describe('events api', () => {
  it('lists every event with one GET without query string', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [jazzEvent, rockEvent] })

    await expect(listEvents()).resolves.toEqual([jazzEvent, rockEvent])
    expect(api.requests.map((request) => request.url)).toEqual(['/api/v1/events'])
  })

  it('gets one event by id', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events/4', { status: 200, data: jazzEvent })

    await expect(getEvent(4)).resolves.toEqual(jazzEvent)
    expect(api.requests[0]!.method).toBe('GET')
  })

  it('creates an event with the given body', async () => {
    const api = installFakeApi()
    api.post('/api/v1/events', { status: 201, data: jazzEvent })

    await expect(createEvent(createBody)).resolves.toEqual(jazzEvent)
    expect(api.requests[0]!.body).toEqual(createBody)
  })

  it('updates an event sending only the patch', async () => {
    const api = installFakeApi()
    api.put('/api/v1/events/4', { status: 200, data: { ...jazzEvent, price: 25 } })

    await expect(updateEvent(4, { price: 25 })).resolves.toEqual({ ...jazzEvent, price: 25 })
    expect(api.requests[0]!.body).toEqual({ price: 25 })
  })

  it('deletes an event answering 204', async () => {
    const api = installFakeApi()
    api.delete('/api/v1/events/4', { status: 204 })

    await expect(deleteEvent(4)).resolves.toBeUndefined()
    expect(api.requests[0]!.method).toBe('DELETE')
  })

  it('rejects a response that breaks the schema with a plain error', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events', { status: 200, data: [{ ...jazzEvent, id: '4' }] })

    const error = await listEvents().catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiError)
  })

  it.each([
    ['getEvent', () => getEvent(4)],
    ['createEvent', () => createEvent(createBody)],
    ['updateEvent', () => updateEvent(4, { price: 1 })],
  ])('%s rejects a malformed body', async (_name, call) => {
    const api = installFakeApi()
    api.get('/api/v1/events/4', { status: 200, data: {} })
    api.post('/api/v1/events', { status: 201, data: {} })
    api.put('/api/v1/events/4', { status: 200, data: {} })

    await expect(call()).rejects.toThrow()
  })

  it('rejects HTTP failures as ApiError', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events/999', {
      status: 404,
      data: { status: 404, detail: 'Event with id 999 not found' },
    })

    await expect(getEvent(999)).rejects.toMatchObject({
      status: 404,
      detail: 'Event with id 999 not found',
    })
  })

  it('builds stable query keys', () => {
    expect(eventKeys.all).toEqual(['events'])
    expect(eventKeys.detail(4)).toEqual(['events', 4])
  })
})
