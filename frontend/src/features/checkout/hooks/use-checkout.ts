import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../../components/ui/use-toast'
import { userMessage } from '../../../lib/error-messages'
import { bookingKeys, createBooking } from '../../bookings/api/bookings-api'
import { useCartStore, type CartLine } from '../../cart/hooks/cart-store'
import { eventKeys } from '../../events/api/events-api'
import { createPayment, paymentKeys } from '../api/payments-api'
import { runCheckout, type Payer } from './run-checkout'

export type CheckoutRequest = {
  lines: CartLine[]
  payer: Payer
  onProgress?: (index: number) => void
}

export function useCheckout() {
  const removeMany = useCartStore((state) => state.removeMany)
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ lines, payer, onProgress }: CheckoutRequest) =>
      runCheckout(lines, payer, { createBooking, createPayment }, onProgress),
    onSuccess: (results) => {
      removeMany(
        results
          .filter((result) => result.kind === 'approved')
          .map((result) => result.line.event.id),
      )
      for (const result of results) {
        if (result.kind !== 'error') continue
        toast.show({
          tone: 'danger',
          title: userMessage(result.error),
          description: result.line.event.title,
        })
      }
      for (const queryKey of [eventKeys.all, bookingKeys.all, paymentKeys.all]) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}
