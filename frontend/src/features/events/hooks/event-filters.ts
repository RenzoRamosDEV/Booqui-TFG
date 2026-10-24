import { normalize } from '../../../lib/text'
import type { EventResponse } from '../../../types/event'

export const PAGE_SIZE = 12

export type EventFilters = {
  q?: string
  category?: string
  city?: string
  from?: string
  to?: string
  maxPrice?: number
  page: number
}

export type FilterKey = Exclude<keyof EventFilters, 'page'>

const TEXT_KEYS = ['q', 'category', 'city'] as const
const DATE_KEYS = ['from', 'to'] as const
const URL_ORDER = ['q', 'category', 'city', 'from', 'to', 'maxPrice', 'page'] as const

function text(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function isoDay(value: string): string | undefined {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10) === value ? value : undefined
}

export function parseMaxPrice(value: string | null): number | undefined {
  if (!value?.trim()) return undefined
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined
}

function pageNumber(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) ? Math.max(page, 1) : 1
}

export function parseEventFilters(params: URLSearchParams): EventFilters {
  const filters: EventFilters = { page: pageNumber(params.get('page')) }
  for (const key of TEXT_KEYS) {
    const value = text(params.get(key))
    if (value) filters[key] = value
  }
  for (const key of DATE_KEYS) {
    const value = isoDay(params.get(key) ?? '')
    if (value) filters[key] = value
  }
  const maxPrice = parseMaxPrice(params.get('maxPrice'))
  if (maxPrice !== undefined) filters.maxPrice = maxPrice
  return filters
}

export function serializeEventFilters(filters: EventFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of URL_ORDER) {
    const value = filters[key]
    if (value === undefined || value === '' || (key === 'page' && value === 1)) continue
    params.set(key, String(value))
  }
  return params
}

function includesText(haystack: string | null, needle: string) {
  return haystack !== null && normalize(haystack).includes(needle)
}

function matches(event: EventResponse, filters: EventFilters): boolean {
  const day = event.startDate.slice(0, 10)
  const q = filters.q && normalize(filters.q)
  if (q && ![event.title, event.description, event.organizer].some((f) => includesText(f, q))) {
    return false
  }
  if (filters.category && normalize(event.category) !== normalize(filters.category)) return false
  if (filters.city && !includesText(event.location, normalize(filters.city))) return false
  if (filters.from && day < filters.from) return false
  if (filters.to && day > filters.to) return false
  if (event.price > (filters.maxPrice ?? Infinity)) return false
  return true
}

export function byStartDate(a: EventResponse, b: EventResponse): number {
  return a.startDate.localeCompare(b.startDate)
}

export function applyEventFilters(events: EventResponse[], filters: EventFilters): EventResponse[] {
  return events.filter((event) => matches(event, filters)).sort(byStartDate)
}

export type Page<T> = { items: T[]; page: number; totalPages: number }

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(page, 1), totalPages)
  const start = (current - 1) * size
  return { items: items.slice(start, start + size), page: current, totalPages }
}
