import { Overlay, type OverlayProps } from './Overlay'

export type DialogProps = OverlayProps

export function Dialog(props: DialogProps) {
  return <Overlay {...props} placement="center" />
}
