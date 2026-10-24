import { useLocation, useNavigate } from 'react-router'
import { useToast } from '../../../components/ui/use-toast'
import type { EventResponse } from '../../../types/event'
import { loginRedirectPath } from '../../auth/hooks/access'
import { useSessionStore } from '../../auth/hooks/session-store'
import { useCartStore } from './cart-store'

export function useAddToCart() {
  const user = useSessionStore((state) => state.user)
  const add = useCartStore((state) => state.add)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  return (event: EventResponse, quantity: number) => {
    if (!user) {
      navigate(loginRedirectPath(location))
      return
    }
    add(event, quantity)
    toast.show({
      tone: 'success',
      title: 'Añadido al carrito',
      description: `${quantity} × ${event.title}`,
    })
  }
}
