import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'
import { Field } from './Field'

export type InputProps = ComponentPropsWithRef<'input'> & { label: string; error?: string }

export function Input({ label, error, id, className, ...props }: InputProps) {
  return (
    <Field label={label} error={error} id={id} className={className}>
      {(control) => <input {...props} {...control} className={cn(control.className, 'h-11')} />}
    </Field>
  )
}
