import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-bg-elevated/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-xl font-semibold text-fg">{title}</h2>
      {description && <p className="text-sm text-fg-muted">{description}</p>}
      {action}
    </div>
  )
}
