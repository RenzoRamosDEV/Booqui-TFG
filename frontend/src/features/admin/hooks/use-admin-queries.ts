import { useQuery } from '@tanstack/react-query'
import { listUsers, userKeys } from '../../auth/api/users-api'
import { bookingKeys, listBookings } from '../../bookings/api/bookings-api'
import { listPayments, paymentKeys } from '../../checkout/api/payments-api'

export function useUsers() {
  return useQuery({ queryKey: userKeys.all, queryFn: listUsers })
}

export function usePayments() {
  return useQuery({ queryKey: paymentKeys.all, queryFn: listPayments })
}

export function useAllBookings() {
  return useQuery({ queryKey: bookingKeys.all, queryFn: listBookings })
}
