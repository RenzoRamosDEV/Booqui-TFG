import { useSearchParams } from 'react-router'
import {
  parseEventFilters,
  serializeEventFilters,
  type EventFilters,
  type FilterKey,
} from './event-filters'

export function useEventFilters() {
  const [params, setParams] = useSearchParams()
  const filters = parseEventFilters(params)

  function update(next: EventFilters, replace: boolean) {
    setParams(serializeEventFilters(next), { replace })
  }

  return {
    filters,
    hasFilters: Object.keys(filters).some((key) => key !== 'page'),
    setFilter: (key: FilterKey, value: EventFilters[FilterKey]) =>
      update({ ...filters, [key]: value, page: 1 }, true),
    setFilters: (patch: Partial<Omit<EventFilters, 'page'>>) =>
      update({ ...filters, ...patch, page: 1 }, true),
    setPage: (page: number) => update({ ...filters, page }, false),
    clear: () => setParams(new URLSearchParams()),
  }
}
