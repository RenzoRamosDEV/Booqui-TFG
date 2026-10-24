import { cn } from '../../lib/cn'
import { Overlay, type OverlayProps } from './Overlay'

export type DrawerProps = OverlayProps

export function Drawer({ className, ...props }: DrawerProps) {
  return <Overlay {...props} placement="right" className={cn('overflow-y-auto', className)} />
}
