import { paymentFormSchema, type PaymentFormValues } from './payment-form-schema'

const now = new Date('2030-06-15T10:00:00')

const card: PaymentFormValues = {
  method: 'CREDIT_CARD',
  holder: 'Mel García',
  cardNumber: '4242 4242 4242 4242',
  expiry: '12/31',
  cvv: '123',
}

function firstMessages(values: PaymentFormValues) {
  const result = paymentFormSchema(now).safeParse(values)
  const byField: Record<string, string> = {}
  for (const issue of result.error?.issues ?? []) byField[issue.path.join('.')] ??= issue.message
  return byField
}

describe('paymentFormSchema', () => {
  it.each(['CREDIT_CARD', 'DEBIT_CARD'] as const)(
    'accepts a valid %s and strips spaces',
    (method) => {
      expect(paymentFormSchema(now).parse({ ...card, method })).toEqual({
        method,
        cardNumber: '4242424242424242',
      })
    },
  )

  it('accepts PayPal ignoring every card field', () => {
    expect(
      paymentFormSchema(now).parse({
        method: 'PAYPAL',
        holder: '',
        cardNumber: '12',
        expiry: 'x',
        cvv: '',
      }),
    ).toEqual({ method: 'PAYPAL', cardNumber: null })
  })

  it('rejects an unknown method', () => {
    expect(paymentFormSchema(now).safeParse({ ...card, method: 'BANK_TRANSFER' }).success).toBe(
      false,
    )
  })

  it('requires the holder', () => {
    expect(firstMessages({ ...card, holder: '  ' })).toEqual({
      holder: 'Indica el titular de la tarjeta',
    })
  })

  it.each([
    ['1234 5678 9012', false],
    ['1234567890123', true],
    ['1234 5678 9012 3456 789', true],
    ['12345678901234567890', false],
    ['4242-4242-4242-4242', false],
    ['', false],
  ])('card number %j valid=%s', (cardNumber, valid) => {
    const messages = firstMessages({ ...card, cardNumber })
    expect(messages.cardNumber === undefined).toBe(valid)
    if (!valid)
      expect(messages.cardNumber).toBe('El número de tarjeta debe tener entre 13 y 19 dígitos')
  })

  it.each([
    ['06/30', undefined],
    ['07/30', undefined],
    ['01/31', undefined],
    ['05/30', 'La tarjeta está caducada'],
    ['12/29', 'La tarjeta está caducada'],
    ['13/30', 'Usa el formato MM/AA'],
    ['00/31', 'Usa el formato MM/AA'],
    ['6/30', 'Usa el formato MM/AA'],
    ['06/2030', 'Usa el formato MM/AA'],
    ['x06/30', 'Usa el formato MM/AA'],
    ['', 'Usa el formato MM/AA'],
  ])('expiry %j → %s', (expiry, message) => {
    expect(firstMessages({ ...card, expiry }).expiry).toBe(message)
  })

  it.each(['13/30', '05/30'])('reports expiry %j as a custom issue', (expiry) => {
    const issues = paymentFormSchema(now).safeParse({ ...card, expiry }).error?.issues ?? []

    expect(issues.map((issue) => [issue.path.join('.'), issue.code])).toEqual([
      ['expiry', 'custom'],
    ])
  })

  it.each([
    ['12', false],
    ['123', true],
    ['1234', true],
    ['12345', false],
    ['12a', false],
  ])('cvv %j valid=%s', (cvv, valid) => {
    const messages = firstMessages({ ...card, cvv })
    expect(messages.cvv).toBe(valid ? undefined : 'El CVV debe tener 3 o 4 dígitos')
  })

  it('uses the current date by default', () => {
    expect(paymentFormSchema().safeParse({ ...card, expiry: '01/20' }).success).toBe(false)
    expect(paymentFormSchema().safeParse({ ...card, expiry: '01/99' }).success).toBe(true)
  })
})
