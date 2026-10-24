import { LoaderCircle } from 'lucide-react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { pressable } from '../../lib/motion'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles'

export type { ButtonSize, ButtonVariant }

export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const reduced = useReducedMotion() ?? false
  const inactive = disabled || loading
  return (
    <motion.button
      type={type}
      data-variant={variant}
      disabled={inactive}
      aria-busy={loading || undefined}
      {...(inactive ? {} : pressable(reduced))}
      className={cn(buttonClasses({ variant, size }), className)}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </motion.button>
  )
}
