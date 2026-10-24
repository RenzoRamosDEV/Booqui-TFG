import { Minus, Plus } from 'lucide-react'
import { cn } from '../lib/cn'
import { focusRing } from './ui/button-styles'

export type QuantitySelectorProps = {
  value: number
  max: number
  onChange: (value: number) => void
  min?: number
  disabled?: boolean
  label?: string
  decreaseLabel?: string
  increaseLabel?: string
  valueLabel?: string
  className?: string
}

const stepButton = cn(
  'grid size-10 place-items-center rounded-md text-fg transition-colors duration-150 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/5',
  focusRing,
)

export function QuantitySelector({
  value,
  max,
  onChange,
  min = 1,
  disabled = false,
  label = 'Cantidad de entradas',
  decreaseLabel = 'Quitar una entrada',
  increaseLabel = 'Añadir una entrada',
  valueLabel = 'Entradas seleccionadas',
  className,
}: QuantitySelectorProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className={stepButton}
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <output
        aria-label={valueLabel}
        aria-live="polite"
        className="min-w-8 text-center text-base font-semibold text-fg tabular-nums"
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className={stepButton}
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
