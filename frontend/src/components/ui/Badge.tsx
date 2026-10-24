import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-bg-elevated text-fg-muted border-border',
  brand:
    'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-400/10 dark:text-brand-300 dark:border-brand-400/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
}

export type BadgeProps = ComponentPropsWithRef<'span'> & { tone?: BadgeTone }

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
