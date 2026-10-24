import { z } from 'zod'
import { http } from '../../../lib/http'
import type { CreateEventRequest, EventResponse, UpdateEventRequest } from '../../../types/event'
import { eventResponseSchema } from './schemas'

const BASE = '/api/v1/events'

export const eventKeys = {
  all: ['events'] as const,
  detail: (id: number) => ['events', id] as const,
}

export async function listEvents(): Promise<EventResponse[]> {
  const { data } = await http.get<unknown>(BASE)
  return z.array(eventResponseSchema).parse(data)
}

export async function getEvent(id: number): Promise<EventResponse> {
  const { data } = await http.get<unknown>(`${BASE}/${id}`)
  return eventResponseSchema.parse(data)
}

export async function createEvent(body: CreateEventRequest): Promise<EventResponse> {
  const { data } = await http.post<unknown>(BASE, body)
  return eventResponseSchema.parse(data)
}

export async function updateEvent(id: number, patch: UpdateEventRequest): Promise<EventResponse> {
  const { data } = await http.put<unknown>(`${BASE}/${id}`, patch)
  return eventResponseSchema.parse(data)
}

export async function deleteEvent(id: number): Promise<void> {
  await http.delete(`${BASE}/${id}`)
}
