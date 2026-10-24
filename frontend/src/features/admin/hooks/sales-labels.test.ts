import { paymentMethodLabel, paymentStatusLabel, paymentStatusTone } from './sales-labels'

describe('sales labels', () => {
  it.each([
    ['CREDIT_CARD', 'Tarjeta de crédito'],
    ['DEBIT_CARD', 'Tarjeta de débito'],
    ['PAYPAL', 'PayPal'],
    ['BANK_TRANSFER', 'Transferencia'],
  ] as const)('method %s → %s', (method, label) => {
    expect(paymentMethodLabel(method)).toBe(label)
  })

  it.each([
    ['APPROVED', 'Aprobado', 'success'],
    ['REJECTED', 'Rechazado', 'danger'],
    ['PENDING', 'Pendiente', 'warning'],
  ] as const)('status %s → %s (%s)', (status, label, tone) => {
    expect(paymentStatusLabel(status)).toBe(label)
    expect(paymentStatusTone(status)).toBe(tone)
  })
})
