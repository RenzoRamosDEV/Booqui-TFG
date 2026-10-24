import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getPageItems } from '../../lib/pagination'
import { focusRing } from './button-styles'

export type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const itemClass =
  'inline-flex size-10 items-center justify-center rounded-md text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40'

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav
      aria-label="Paginación"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(itemClass, focusRing, 'text-fg hover:bg-brand-50 dark:hover:bg-white/5')}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </button>
      {getPageItems(page, totalPages).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onPageChange(item)}
            className={cn(
              itemClass,
              focusRing,
              item === page
                ? 'bg-primary text-primary-fg shadow-sm'
                : 'text-fg hover:bg-brand-50 dark:hover:bg-white/5',
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="px-1 text-fg-muted">
            …
          </span>
        ),
      )}
      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(itemClass, focusRing, 'text-fg hover:bg-brand-50 dark:hover:bg-white/5')}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </nav>
  )
}
