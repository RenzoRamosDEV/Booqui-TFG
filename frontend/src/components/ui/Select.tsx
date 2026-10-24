import { ChevronDown } from 'lucide-react'
import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'
import { Field } from './Field'

export type SelectProps = ComponentPropsWithRef<'select'> & { label: string; error?: string }

export function Select({ label, error, id, className, children, ...props }: SelectProps) {
  return (
    <Field label={label} error={error} id={id} className={className}>
      {(control) => (
        <div className="relative">
          <select
            {...props}
            {...control}
            className={cn(control.className, 'h-11 appearance-none pr-10')}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted"
          />
        </div>
      )}
    </Field>
  )
}
