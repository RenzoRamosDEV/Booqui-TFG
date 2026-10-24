import type { EventResponse } from '../../../types/event'
import { byStartDate } from './event-filters'

const FEATURED_COUNT = 3
const UPCOMING_COUNT = 6

export type HomeSections = { featured: EventResponse[]; upcoming: EventResponse[] }

export function homeSections(events: EventResponse[], now: Date): HomeSections {
  const future = events
    .filter((event) => new Date(event.startDate).getTime() > now.getTime())
    .sort(byStartDate)
  const featured = future.filter((event) => event.availableTickets > 0).slice(0, FEATURED_COUNT)
  const upcoming = future.filter((event) => !featured.includes(event)).slice(0, UPCOMING_COUNT)
  return { featured, upcoming }
}
