import type { EventResponse } from '../../types/event'

export const jazzEvent: EventResponse = {
  id: 4,
  title: 'Jazz en Madrid',
  description: 'Una noche de jazz en directo con los mejores cuartetos de la ciudad.',
  availableTickets: 50,
  location: 'IFEMA, Madrid',
  startDate: '2030-11-10T21:00:00',
  endDate: '2030-11-10T23:30:00',
  organizer: 'Blue Note Madrid',
  price: 12.5,
  category: 'Música',
  contactEmail: 'jazz@booqi.com',
  contactPhone: '+34600111222',
  imageUrl: 'https://images.booqi.test/jazz.jpg',
  createdAt: '2030-01-10T09:30:00',
  updatedAt: '2030-01-10T09:30:00',
}

export const rockEvent: EventResponse = {
  ...jazzEvent,
  id: 7,
  title: 'Rock en Madrid',
  description: null,
  location: 'WiZink Center, Madrid',
  startDate: '2030-12-01T20:00:00',
  endDate: '2030-12-01T23:00:00',
  organizer: 'Live Nation',
  price: 30,
  contactEmail: 'rock@booqi.com',
  imageUrl: null,
}

export const foodEvent: EventResponse = {
  ...jazzEvent,
  id: 9,
  title: 'Gastronomía local',
  description: 'Ruta de tapas por el centro de Sevilla.',
  availableTickets: 2,
  location: 'Plaza Nueva, Sevilla',
  startDate: '2030-10-05T12:00:00',
  endDate: '2030-10-05T16:00:00',
  organizer: 'Sabores del Sur',
  price: 0,
  category: 'Gastronomía',
  contactEmail: 'tapas@booqi.com',
  imageUrl: null,
}

export function eventWith(overrides: Partial<EventResponse>): EventResponse {
  return { ...jazzEvent, ...overrides }
}
