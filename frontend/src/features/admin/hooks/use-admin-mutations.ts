import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateEventRequest } from '../../../types/event'
import { deleteUser, userKeys } from '../../auth/api/users-api'
import { createEvent, deleteEvent, eventKeys, updateEvent } from '../../events/api/events-api'

function useInvalidate(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey })
}

export function useCreateEvent() {
  return useMutation({ mutationFn: createEvent, onSuccess: useInvalidate(eventKeys.all) })
}

export function useUpdateEvent() {
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateEventRequest }) =>
      updateEvent(id, patch),
    onSuccess: useInvalidate(eventKeys.all),
  })
}

export function useDeleteEvent() {
  return useMutation({ mutationFn: deleteEvent, onSuccess: useInvalidate(eventKeys.all) })
}

export function useDeleteUser() {
  return useMutation({ mutationFn: deleteUser, onSuccess: useInvalidate(userKeys.all) })
}
