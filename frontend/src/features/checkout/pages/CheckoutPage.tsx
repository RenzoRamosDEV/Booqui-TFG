import { Check, PartyPopper, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { PageMeta } from '../../../app/PageMeta'
import { PageHeader } from '../../../components/PageHeader'
import { Button } from '../../../components/ui/Button'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { EmptyState } from '../../../components/ui/EmptyState'
import { cn } from '../../../lib/cn'
import { formatEuro } from '../../../lib/money'
import { useSessionStore } from '../../auth/hooks/session-store'
import {
  cartTotalCents,
  lineTotalCents,
  useCartStore,
  type CartLine,
} from '../../cart/hooks/cart-store'
import { priceLabel } from '../../events/hooks/event-labels'
import type { PaymentDetails } from '../api/payment-form-schema'
import { LineResultCard } from '../components/LineResultCard'
import { PaymentForm } from '../components/PaymentForm'
import { SuccessBurst } from '../components/SuccessBurst'
import type { LineResult } from '../hooks/run-checkout'
import { useCheckout } from '../hooks/use-checkout'

type Step = 'review' | 'payment' | 'results'

const steps: Array<{ id: Step; label: string }> = [
  { id: 'review', label: 'Revisión' },
  { id: 'payment', label: 'Pago' },
  { id: 'results', label: 'Confirmación' },
]

function Stepper({ current }: { current: Step }) {
  const currentIndex = steps.findIndex((step) => step.id === current)
  return (
    <ol aria-label="Pasos del pago" className="flex items-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className="flex flex-1 items-center gap-2 text-sm"
          >
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-200',
                active &&
                  'bg-gradient-brand text-white shadow-md dark:bg-none dark:bg-primary dark:text-primary-fg',
                done && 'bg-success/15 text-success',
                !active && !done && 'bg-bg-elevated text-fg-muted ring-1 ring-border',
              )}
            >
              {done ? <Check aria-hidden="true" className="size-4" /> : index + 1}
            </span>
            <span
              className={cn('hidden font-medium sm:inline', active ? 'text-fg' : 'text-fg-muted')}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function OrderReview({ lines, onContinue }: { lines: CartLine[]; onContinue: () => void }) {
  return (
    <section aria-label="Revisa tu pedido" className="flex flex-col gap-5">
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {lines.map((line) => (
          <li key={line.event.id} className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-fg">{line.event.title}</span>
              <span className="text-sm text-fg-muted">
                {line.quantity} × {priceLabel(line.event.price)}
              </span>
            </div>
            <span className="font-display font-bold text-fg">
              {formatEuro(lineTotalCents(line))}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between rounded-lg bg-brand-50/70 px-4 py-3 dark:bg-brand-400/10">
        <span className="font-semibold text-fg">Total</span>
        <span data-checkout-total className="font-display text-2xl font-bold text-fg">
          {formatEuro(cartTotalCents(lines))}
        </span>
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <ButtonLink to="/cart" variant="ghost">
          Editar carrito
        </ButtonLink>
        <Button size="lg" onClick={onContinue}>
          Continuar al pago
        </Button>
      </div>
    </section>
  )
}

function Results({ results, cartHasLines }: { results: LineResult[]; cartHasLines: boolean }) {
  const allApproved = results.every((result) => result.kind === 'approved')
  return (
    <section aria-labelledby="results-title" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        {allApproved && <SuccessBurst />}
        <h2 id="results-title" className="font-display text-2xl font-bold text-fg sm:text-3xl">
          {allApproved ? '¡Pago completado!' : 'Resultado del pago'}
        </h2>
        <p className="max-w-lg text-fg-muted">
          {allApproved
            ? 'Tus entradas están listas. Descárgalas o consúltalas cuando quieras en «Mis reservas».'
            : 'Revisa el resultado de cada evento. Lo que no se ha pagado sigue en tu carrito.'}
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {results.map((result) => (
          <LineResultCard key={result.line.event.id} result={result} />
        ))}
      </ul>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink to="/my-bookings">
          <PartyPopper aria-hidden="true" className="size-4" />
          Ver mis reservas
        </ButtonLink>
        {cartHasLines && (
          <ButtonLink to="/cart" variant="secondary">
            Volver al carrito
          </ButtonLink>
        )}
      </div>
    </section>
  )
}

export function CheckoutPage() {
  const lines = useCartStore((state) => state.lines)
  const user = useSessionStore((state) => state.user)
  const checkout = useCheckout()
  const [step, setStep] = useState<Step>('review')
  const [results, setResults] = useState<LineResult[]>([])
  const [progress, setProgress] = useState(0)
  const [paidLines, setPaidLines] = useState<CartLine[]>([])

  async function pay(details: PaymentDetails) {
    if (!user) return
    setPaidLines(lines)
    setProgress(0)
    const lineResults = await checkout.mutateAsync({
      lines,
      payer: { userId: user.id, ...details },
      onProgress: setProgress,
    })
    setResults(lineResults)
    setStep('results')
  }

  const empty = step !== 'results' && lines.length === 0
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageMeta
        title="Pago"
        description="Confirma tus entradas y completa el pago de forma segura."
      />
      <PageHeader eyebrow="Checkout" title="Pago" />
      {empty ? (
        <EmptyState
          icon={ShoppingBag}
          title="No hay nada que pagar"
          description="Tu carrito está vacío. Elige un evento y añade tus entradas."
          action={<ButtonLink to="/events">Explorar eventos</ButtonLink>}
        />
      ) : (
        <>
          <Stepper current={step} />
          <div className="rounded-xl border border-glass-border bg-glass p-5 shadow-lg backdrop-blur-xl sm:p-8">
            {step === 'review' && (
              <OrderReview lines={lines} onContinue={() => setStep('payment')} />
            )}
            {step === 'payment' && (
              <PaymentForm
                payLabel={`Pagar ${formatEuro(cartTotalCents(lines))}`}
                processing={checkout.isPending}
                processingLabel={`Procesando ${Math.min(progress + 1, paidLines.length)} de ${paidLines.length}…`}
                onSubmit={pay}
                onBack={() => setStep('review')}
              />
            )}
            {step === 'results' && <Results results={results} cartHasLines={lines.length > 0} />}
          </div>
        </>
      )}
    </div>
  )
}
