import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'

export type CardProps = ComponentPropsWithRef<'div'>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface p-6 text-fg shadow-md dark:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
