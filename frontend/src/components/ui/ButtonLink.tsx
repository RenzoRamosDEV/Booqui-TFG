import { Link, type LinkProps } from 'react-router'
import { cn } from '../../lib/cn'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles'

export type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: ButtonSize }

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={cn(buttonClasses({ variant, size }), className as string)} />
}
