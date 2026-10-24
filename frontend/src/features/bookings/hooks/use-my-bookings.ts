import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingKeys, cancelBooking, listBookingsByUser } from '../api/bookings-api'

export function useMyBookings(userId: number) {
  return useQuery({
    queryKey: bookingKeys.byUser(userId),
    queryFn: () => listBookingsByUser(userId),
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  })
}
