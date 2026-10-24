import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const controlClass =
  'w-full rounded-md border bg-surface px-3.5 text-sm text-fg shadow-sm transition-colors duration-150 placeholder:text-fg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60'

type ControlProps = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
  className: string
}

type FieldProps = {
  label: string
  error?: string
  id?: string
  className?: string
  children: (control: ControlProps) => ReactNode
}

export function Field({ label, error, id, className, children }: FieldProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const errorId = `${controlId}-error`
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children({
        id: controlId,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        className: cn(
          controlClass,
          error
            ? 'border-danger'
            : 'border-border hover:border-brand-300 dark:hover:border-brand-700',
        ),
      })}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
