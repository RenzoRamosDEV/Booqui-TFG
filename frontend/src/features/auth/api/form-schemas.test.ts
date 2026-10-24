import {
  loginSchema,
  profileSchema,
  registerSchema,
  toCreateUserRequest,
  type RegisterValues,
} from './form-schemas'

const now = new Date('2030-06-15T10:00:00')

/** First message per field, as the form resolver shows it. */
function messages(result: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}) {
  const firstByField: Record<string, string> = {}
  for (const issue of result.error?.issues ?? [])
    firstByField[issue.path.join('.')] ??= issue.message
  return firstByField
}

const valid: RegisterValues = {
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '2000-01-01',
  contactPhone: '',
  contactEmail: 'mel@booqi.com',
  password: 'secreto1',
  confirmPassword: 'secreto1',
}

describe('loginSchema', () => {
  it('accepts an email and a password', () => {
    expect(loginSchema.safeParse({ contactEmail: 'mel@booqi.com', password: 'x' }).success).toBe(
      true,
    )
  })

  it.each([
    [{ contactEmail: '', password: 'x' }, { contactEmail: 'El email es obligatorio' }],
    [{ contactEmail: 'mel', password: 'x' }, { contactEmail: 'El email debe ser válido' }],
    [{ contactEmail: 'mel@booqi.com', password: '' }, { password: 'La contraseña es obligatoria' }],
  ])('rejects %j', (values, expected) => {
    expect(messages(loginSchema.safeParse(values))).toEqual(expected)
  })

  it('trims the email', () => {
    expect(loginSchema.parse({ contactEmail: ' mel@booqi.com ', password: 'x' }).contactEmail).toBe(
      'mel@booqi.com',
    )
  })
})

describe('registerSchema', () => {
  const parse = (patch: Partial<RegisterValues>) =>
    registerSchema(now).safeParse({ ...valid, ...patch })

  it('accepts valid values', () => {
    expect(parse({}).success).toBe(true)
  })

  it.each([
    ['', 'El nombre es obligatorio'],
    ['M', 'El nombre debe tener entre 2 y 50 caracteres'],
    ['M'.repeat(51), 'El nombre debe tener entre 2 y 50 caracteres'],
  ])('rejects firstName %j', (firstName, message) => {
    expect(messages(parse({ firstName }))).toEqual({ firstName: message })
  })

  it('treats a blank first name as missing', () => {
    expect(messages(parse({ firstName: '   ' }))).toEqual({ firstName: 'El nombre es obligatorio' })
  })

  it.each(['Me', 'M'.repeat(50)])('accepts firstName of boundary length %j', (firstName) => {
    expect(parse({ firstName }).success).toBe(true)
  })

  it.each([
    ['', 'El apellido es obligatorio'],
    ['G', 'El apellido debe tener entre 2 y 50 caracteres'],
    ['G'.repeat(51), 'El apellido debe tener entre 2 y 50 caracteres'],
  ])('rejects lastName %j', (lastName, message) => {
    expect(messages(parse({ lastName }))).toEqual({ lastName: message })
  })

  it.each(['Ga', 'G'.repeat(50)])('accepts lastName %j', (lastName) => {
    expect(parse({ lastName }).success).toBe(true)
  })

  it.each([
    ['', 'La fecha de nacimiento es obligatoria'],
    ['2030-06-15', 'La fecha de nacimiento debe ser una fecha pasada'],
    ['2031-01-01', 'La fecha de nacimiento debe ser una fecha pasada'],
    ['no-date', 'La fecha de nacimiento es obligatoria'],
    ['x2000-01-01', 'La fecha de nacimiento es obligatoria'],
  ])('rejects dateOfBirth %j', (dateOfBirth, message) => {
    expect(messages(parse({ dateOfBirth }))).toEqual({ dateOfBirth: message })
  })

  it('ignores spaces around the phone', () => {
    expect(parse({ contactPhone: ' 600111222 ' }).success).toBe(true)
  })

  it('rejects a date of birth with trailing text', () => {
    expect(messages(parse({ dateOfBirth: '2000-01-01x' }))).toEqual({
      dateOfBirth: 'La fecha de nacimiento es obligatoria',
    })
  })

  it('accepts yesterday as date of birth', () => {
    expect(parse({ dateOfBirth: '2030-06-14' }).success).toBe(true)
  })

  it('compares against a zero-padded local day', () => {
    const early = registerSchema(new Date('2030-06-05T10:00:00'))

    expect(early.safeParse({ ...valid, dateOfBirth: '2030-06-04' }).success).toBe(true)
    expect(early.safeParse({ ...valid, dateOfBirth: '2030-06-05' }).success).toBe(false)
  })

  it.each(['', '123456789', '+123456789012345', '600111222'])(
    'accepts phone %j',
    (contactPhone) => {
      expect(parse({ contactPhone }).success).toBe(true)
    },
  )

  it.each(['12345678', '1234567890123456', '+34 600', 'abc123456'])(
    'rejects phone %j',
    (contactPhone) => {
      expect(messages(parse({ contactPhone }))).toEqual({
        contactPhone: 'El teléfono debe tener entre 9 y 15 dígitos',
      })
    },
  )

  it.each([
    ['', 'El email es obligatorio'],
    ['mel@', 'El email debe ser válido'],
  ])('rejects email %j', (contactEmail, message) => {
    expect(messages(parse({ contactEmail }))).toEqual({ contactEmail: message })
  })

  it('rejects a 7-character password', () => {
    expect(messages(parse({ password: 'abc1234', confirmPassword: 'abc1234' }))).toEqual({
      password: 'La contraseña debe tener al menos 8 caracteres',
    })
  })

  it('accepts an 8-character password', () => {
    expect(parse({ password: 'abc12345', confirmPassword: 'abc12345' }).success).toBe(true)
  })

  it('rejects a confirmation that does not match', () => {
    expect(messages(parse({ confirmPassword: 'otra1234' }))).toEqual({
      confirmPassword: 'Las contraseñas no coinciden',
    })
  })

  it('uses the current date by default', () => {
    expect(registerSchema().safeParse({ ...valid, dateOfBirth: '2999-01-01' }).success).toBe(false)
    expect(registerSchema().safeParse(valid).success).toBe(true)
  })
})

describe('toCreateUserRequest', () => {
  it('builds a CUSTOMER request without confirmation or empty phone', () => {
    expect(toCreateUserRequest(valid)).toStrictEqual({
      firstName: 'Mel',
      lastName: 'García',
      dateOfBirth: '2000-01-01',
      contactEmail: 'mel@booqi.com',
      password: 'secreto1',
      role: 'CUSTOMER',
    })
  })

  it('keeps a phone when present', () => {
    expect(toCreateUserRequest({ ...valid, contactPhone: '+34600111222' }).contactPhone).toBe(
      '+34600111222',
    )
  })
})

describe('profileSchema', () => {
  const base = {
    firstName: 'Mel',
    lastName: 'García',
    dateOfBirth: '2000-01-01',
    contactPhone: '',
    contactEmail: 'mel@booqi.com',
    password: '',
    confirmPassword: '',
  }
  const parse = (patch: object) => profileSchema(now).safeParse({ ...base, ...patch })

  it('accepts an empty new password', () => {
    expect(parse({}).success).toBe(true)
  })

  it('validates a new password like registration', () => {
    expect(messages(parse({ password: 'abc1234', confirmPassword: 'abc1234' }))).toEqual({
      password: 'La contraseña debe tener al menos 8 caracteres',
    })
    expect(messages(parse({ password: 'abc12345', confirmPassword: 'otra' }))).toEqual({
      confirmPassword: 'Las contraseñas no coinciden',
    })
  })

  it('validates the other fields like registration', () => {
    expect(messages(parse({ firstName: 'M', contactPhone: '1' }))).toEqual({
      firstName: 'El nombre debe tener entre 2 y 50 caracteres',
      contactPhone: 'El teléfono debe tener entre 9 y 15 dígitos',
    })
  })

  it('uses the current date by default', () => {
    expect(profileSchema().safeParse({ ...base, dateOfBirth: '2999-01-01' }).success).toBe(false)
  })
})
