import { ConfirmDialog } from '../../../components/ConfirmDialog'
import type { BookingResponse } from '../../../types/booking'

export type CancelBookingDialogProps = {
  booking: BookingResponse | null
  cancelling: boolean
  onConfirm: (booking: BookingResponse) => void
  onClose: () => void
}

export function CancelBookingDialog({
  booking,
  cancelling,
  onConfirm,
  onClose,
}: CancelBookingDialogProps) {
  return (
    <ConfirmDialog
      open={booking !== null}
      title="¿Cancelar la reserva?"
      description={
        booking
          ? `Vas a cancelar la reserva ${booking.id} de «${booking.eventTitle}». Esta acción no se puede deshacer y no devuelve el importe pagado.`
          : ''
      }
      confirmLabel="Sí, cancelar"
      cancelLabel="Mantener reserva"
      busy={cancelling}
      onConfirm={() => booking && onConfirm(booking)}
      onClose={onClose}
    />
  )
}
