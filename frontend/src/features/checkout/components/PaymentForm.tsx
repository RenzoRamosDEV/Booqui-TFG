import { CreditCard, Lock, Wallet, type LucideIcon } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { cn } from '../../../lib/cn'
import { zodResolver } from '../../../lib/zod-resolver'
import {
  paymentFormSchema,
  type CheckoutMethod,
  type PaymentDetails,
  type PaymentFormValues,
} from '../api/payment-form-schema'

const methods: Array<{ value: CheckoutMethod; label: string; hint: string; icon: LucideIcon }> = [
  {
    value: 'CREDIT_CARD',
    label: 'Tarjeta de crédito',
    hint: 'Visa, Mastercard…',
    icon: CreditCard,
  },
  { value: 'DEBIT_CARD', label: 'Tarjeta de débito', hint: 'Cargo inmediato', icon: CreditCard },
  { value: 'PAYPAL', label: 'PayPal', hint: 'Sin datos de tarjeta', icon: Wallet },
]

const emptyForm: PaymentFormValues = {
  method: 'CREDIT_CARD',
  holder: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
}

export type PaymentFormProps = {
  payLabel: string
  processing: boolean
  processingLabel: string
  onSubmit: (details: PaymentDetails) => void
  onBack: () => void
}

export function PaymentForm({
  payLabel,
  processing,
  processingLabel,
  onSubmit,
  onBack,
}: PaymentFormProps) {
  const form = useForm({ resolver: zodResolver(paymentFormSchema()), defaultValues: emptyForm })
  const method = useWatch({ control: form.control, name: 'method' })
  const { errors } = form.formState
  const isCard = method !== 'PAYPAL'

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold text-fg">Método de pago</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {methods.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                'relative flex cursor-pointer items-center gap-3 rounded-lg border bg-surface p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg',
                method === value
                  ? 'border-brand-500 shadow-md shadow-brand-600/15 dark:border-brand-400'
                  : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
              )}
            >
              <input type="radio" value={value} className="sr-only" {...form.register('method')} />
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-md',
                  method === value
                    ? 'bg-gradient-brand text-white dark:bg-none dark:bg-primary dark:text-primary-fg'
                    : 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300',
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-fg">{label}</span>
                <span className="text-xs text-fg-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {isCard && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Titular de la tarjeta"
            autoComplete="cc-name"
            error={errors.holder?.message}
            className="sm:col-span-2"
            {...form.register('holder')}
          />
          <Input
            label="Número de tarjeta"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            error={errors.cardNumber?.message}
            className="sm:col-span-2"
            {...form.register('cardNumber')}
          />
          <Input
            label="Caducidad (MM/AA)"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="12/30"
            error={errors.expiry?.message}
            {...form.register('expiry')}
          />
          <Input
            label="CVV"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            error={errors.cvv?.message}
            {...form.register('cvv')}
          />
        </div>
      )}

      <p className="flex items-start gap-2 rounded-md bg-brand-50/70 p-3 text-xs text-brand-900 dark:bg-brand-400/10 dark:text-brand-200">
        <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Pago simulado: no se cobra ninguna tarjeta real y los datos de la tarjeta no se guardan.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack} disabled={processing}>
          Volver
        </Button>
        <Button type="submit" size="lg" loading={processing}>
          {processing ? processingLabel : payLabel}
        </Button>
      </div>
    </form>
  )
}
