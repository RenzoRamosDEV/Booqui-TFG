import { useQuery } from '@tanstack/react-query'
import { eventKeys, getEvent, listEvents } from '../api/events-api'

export function useEvents() {
  return useQuery({ queryKey: eventKeys.all, queryFn: listEvents })
}

export function useEvent(id: number) {
  return useQuery({ queryKey: eventKeys.detail(id), queryFn: () => getEvent(id) })
}
