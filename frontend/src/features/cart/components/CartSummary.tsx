import { ArrowRight, Info } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { formatEuro } from '../../../lib/money'

export type CartSummaryProps = { tickets: number; totalCents: number; onPay: () => void }

export function CartSummary({ tickets, totalCents, onPay }: CartSummaryProps) {
  return (
    <aside
      aria-label="Resumen del pedido"
      className="flex flex-col gap-5 rounded-xl border border-glass-border bg-glass p-6 shadow-lg backdrop-blur-xl lg:sticky lg:top-28 lg:self-start"
    >
      <h2 className="font-display text-xl font-bold text-fg">Resumen</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-muted">Entradas</dt>
          <dd className="font-medium text-fg">{tickets}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold text-fg">Total</dt>
          <dd data-testid="cart-total" className="font-display text-2xl font-bold text-fg">
            {formatEuro(totalCents)}
          </dd>
        </div>
      </dl>
      <Button size="lg" onClick={onPay}>
        Ir al pago
        <ArrowRight aria-hidden="true" className="size-5" />
      </Button>
      <p className="flex gap-2 text-xs text-fg-muted">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Cada evento se reserva y se paga por separado. El total es exactamente lo que se cobra.
      </p>
    </aside>
  )
}
