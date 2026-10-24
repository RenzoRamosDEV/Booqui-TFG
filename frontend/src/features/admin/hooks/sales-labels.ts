import type { BadgeTone } from '../../../components/ui/Badge'
import type { PaymentMethod, PaymentStatus } from '../../../types/payment'

const methods: Record<PaymentMethod, string> = {
  CREDIT_CARD: 'Tarjeta de crédito',
  DEBIT_CARD: 'Tarjeta de débito',
  PAYPAL: 'PayPal',
  BANK_TRANSFER: 'Transferencia',
}

const statuses: Record<PaymentStatus, string> = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PENDING: 'Pendiente',
}

const tones: Record<PaymentStatus, BadgeTone> = {
  APPROVED: 'success',
  REJECTED: 'danger',
  PENDING: 'warning',
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return methods[method]
}

export function paymentStatusLabel(status: PaymentStatus): string {
  return statuses[status]
}

export function paymentStatusTone(status: PaymentStatus): BadgeTone {
  return tones[status]
}
