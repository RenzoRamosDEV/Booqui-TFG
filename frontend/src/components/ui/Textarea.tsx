import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'
import { Field } from './Field'

export type TextareaProps = ComponentPropsWithRef<'textarea'> & { label: string; error?: string }

export function Textarea({ label, error, id, className, rows = 4, ...props }: TextareaProps) {
  return (
    <Field label={label} error={error} id={id} className={className}>
      {(control) => (
        <textarea
          rows={rows}
          {...props}
          {...control}
          className={cn(control.className, 'min-h-24 resize-y py-2.5')}
        />
      )}
    </Field>
  )
}
