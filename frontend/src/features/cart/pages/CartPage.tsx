import { ShoppingBag } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router'
import { PageMeta } from '../../../app/PageMeta'
import { PageHeader } from '../../../components/PageHeader'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { EmptyState } from '../../../components/ui/EmptyState'
import { loginRedirectPath } from '../../auth/hooks/access'
import { useSessionStore } from '../../auth/hooks/session-store'
import { CartLineItem } from '../components/CartLineItem'
import { CartSummary } from '../components/CartSummary'
import { cartTotalCents, ticketCount, useCartStore } from '../hooks/cart-store'

export function CartPage() {
  const lines = useCartStore((state) => state.lines)
  const user = useSessionStore((state) => state.user)
  const navigate = useNavigate()

  function pay() {
    navigate(user ? '/checkout' : loginRedirectPath({ pathname: '/checkout', search: '' }))
  }

  return (
    <div className="flex flex-col gap-8">
      <PageMeta title="Carrito" description="Revisa las entradas que has añadido antes de pagar." />
      <PageHeader eyebrow="Tu compra" title="Tu carrito" />
      {lines.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Tu carrito está vacío"
          description="Añade entradas desde cualquier evento y aparecerán aquí."
          action={<ButtonLink to="/events">Explorar eventos</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ul aria-label="Entradas en el carrito" className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <CartLineItem key={line.event.id} line={line} />
              ))}
            </AnimatePresence>
          </ul>
          <CartSummary
            tickets={ticketCount(lines)}
            totalCents={cartTotalCents(lines)}
            onPay={pay}
          />
        </div>
      )}
    </div>
  )
}
