import { cn } from '../../lib/cn'

export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-brand text-primary-fg shadow-md shadow-brand-600/25 hover:shadow-lg hover:shadow-brand-600/30 dark:bg-none dark:bg-primary dark:shadow-none',
  secondary:
    'bg-surface text-fg border border-border shadow-sm hover:border-brand-300 hover:bg-bg-elevated dark:hover:border-brand-700',
  ghost: 'bg-transparent text-fg hover:bg-brand-50 dark:hover:bg-white/5',
  destructive: 'bg-danger text-danger-fg shadow-sm hover:brightness-110',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
}: { variant?: ButtonVariant; size?: ButtonSize } = {}) {
  return cn(
    'inline-flex select-none items-center justify-center rounded-md font-semibold tracking-tight transition-[background-color,border-color,box-shadow,filter] duration-150 disabled:cursor-not-allowed disabled:opacity-60',
    focusRing,
    variants[variant],
    sizes[size],
  )
}
