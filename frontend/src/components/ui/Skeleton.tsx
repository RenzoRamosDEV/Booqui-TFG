import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-brand-100/70 motion-reduce:animate-none dark:bg-white/5',
        className,
      )}
    />
  )
}
