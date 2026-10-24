import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
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
    <Dialog
      open={booking !== null}
      onClose={onClose}
      title="¿Cancelar la reserva?"
      description={
        booking
          ? `Vas a cancelar la reserva ${booking.id} de «${booking.eventTitle}». Esta acción no se puede deshacer y no devuelve el importe pagado.`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={cancelling}>
            Mantener reserva
          </Button>
          <Button
            variant="destructive"
            loading={cancelling}
            onClick={() => booking && onConfirm(booking)}
          >
            Sí, cancelar
          </Button>
        </>
      }
    />
  )
}
