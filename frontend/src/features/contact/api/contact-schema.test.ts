import { contactSchema } from './contact-schema'

const valid = { name: 'Mel', email: 'mel@booqi.com', subject: 'Duda', message: 'Hola, ¿qué tal?' }

function firstMessages(values: typeof valid) {
  const byField: Record<string, string> = {}
  for (const issue of contactSchema.safeParse(values).error?.issues ?? [])
    byField[issue.path.join('.')] ??= issue.message
  return byField
}

describe('contactSchema', () => {
  it('accepts and trims a complete message', () => {
    expect(contactSchema.parse({ ...valid, name: ' Mel ', subject: ' Duda ' })).toEqual(valid)
  })

  it.each([
    ['name', 'Indica tu nombre'],
    ['email', 'Indica tu email'],
    ['subject', 'Indica el asunto'],
    ['message', 'Escribe tu mensaje'],
  ] as const)('requires %s', (field, message) => {
    expect(firstMessages({ ...valid, [field]: '   ' })).toEqual({ [field]: message })
  })

  it.each(['mel', 'mel@', 'mel booqi.com'])('rejects email %j', (email) => {
    expect(firstMessages({ ...valid, email })).toEqual({ email: 'El email debe ser válido' })
  })

  it('limits the message to 2000 characters', () => {
    expect(firstMessages({ ...valid, message: 'a'.repeat(2000) })).toEqual({})
    expect(firstMessages({ ...valid, message: 'a'.repeat(2001) })).toEqual({
      message: 'El mensaje no puede superar 2000 caracteres',
    })
  })
})
