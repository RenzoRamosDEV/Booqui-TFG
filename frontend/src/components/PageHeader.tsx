import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

export type PageHeaderProps = {
  title: string
  eyebrow?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <span className="w-fit rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        {description && <p className="max-w-2xl text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
