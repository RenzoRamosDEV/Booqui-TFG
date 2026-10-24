import { z } from 'zod'
import type { PaymentMethod } from '../../../types/payment'

export type CheckoutMethod = Exclude<PaymentMethod, 'BANK_TRANSFER'>

export type PaymentFormValues = {
  method: CheckoutMethod
  holder: string
  cardNumber: string
  expiry: string
  cvv: string
}

export type PaymentDetails = { method: CheckoutMethod; cardNumber: string | null }

const EXPIRY = /^(0[1-9]|1[0-2])\/(\d{2})$/

function monthIndex(year: number, month: number) {
  return year * 12 + month
}

function validateExpiry(now: Date) {
  return (expiry: string, context: z.RefinementCtx) => {
    const match = EXPIRY.exec(expiry)
    if (!match) {
      context.addIssue({ code: 'custom', message: 'Usa el formato MM/AA' })
      return
    }
    const expires = monthIndex(2000 + Number(match[2]), Number(match[1]))
    if (expires < monthIndex(now.getFullYear(), now.getMonth() + 1)) {
      context.addIssue({ code: 'custom', message: 'La tarjeta está caducada' })
    }
  }
}

export function paymentFormSchema(now = new Date()) {
  const card = z.object({
    method: z.enum(['CREDIT_CARD', 'DEBIT_CARD']),
    holder: z.string().trim().min(1, 'Indica el titular de la tarjeta'),
    cardNumber: z
      .string()
      .transform((value) => value.replaceAll(' ', ''))
      .pipe(
        z.string().regex(/^\d{13,19}$/, 'El número de tarjeta debe tener entre 13 y 19 dígitos'),
      ),
    expiry: z.string().superRefine(validateExpiry(now)),
    cvv: z.string().regex(/^\d{3,4}$/, 'El CVV debe tener 3 o 4 dígitos'),
  })
  // PayPal keeps the card inputs in the form but never validates or sends them.
  const paypal = z.object({
    method: z.literal('PAYPAL'),
    holder: z.string(),
    cardNumber: z.string(),
    expiry: z.string(),
    cvv: z.string(),
  })
  return z
    .discriminatedUnion('method', [card, paypal])
    .transform((values): PaymentDetails =>
      values.method === 'PAYPAL'
        ? { method: 'PAYPAL', cardNumber: null }
        : { method: values.method, cardNumber: values.cardNumber },
    )
}
