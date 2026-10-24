import { useState } from 'react'
import { cn } from '../../lib/cn'

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
  return initials || '?'
}

export type AvatarProps = { name: string; src?: string; className?: string }

export function Avatar({ name, src, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const label = name.trim() || 'Usuario'
  const base = cn('inline-flex size-9 shrink-0 overflow-hidden rounded-full', className)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        onError={() => setFailed(true)}
        className={cn(base, 'object-cover')}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        base,
        'items-center justify-center bg-gradient-brand text-xs font-semibold text-white dark:text-primary-fg',
      )}
    >
      {initialsOf(name)}
    </span>
  )
}
