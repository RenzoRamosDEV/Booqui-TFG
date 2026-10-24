import { userResponseSchema } from './schemas'

const validUser = {
  id: 7,
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '1995-04-12',
  contactPhone: null,
  contactEmail: 'mel@booqi.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-10T09:30:00',
  updatedAt: '2026-01-10T09:30:00',
}

describe('userResponseSchema', () => {
  it('accepts a UserResponse with a null contactPhone', () => {
    expect(userResponseSchema.parse(validUser)).toEqual(validUser)
  })

  it('accepts an ADMIN with a phone', () => {
    const admin = { ...validUser, role: 'ADMIN', contactPhone: '+34600111222' }

    expect(userResponseSchema.safeParse(admin).success).toBe(true)
  })

  it('drops unknown fields', () => {
    expect(userResponseSchema.parse({ ...validUser, password: 'x' })).toEqual(validUser)
  })

  it.each(Object.keys(validUser))('rejects a user without %s', (field) => {
    const user: Record<string, unknown> = { ...validUser }
    delete user[field]

    expect(userResponseSchema.safeParse(user).success).toBe(false)
  })

  it.each([
    ['role ROOT', { role: 'ROOT' }],
    ['lowercase role', { role: 'admin' }],
    ['string id', { id: '7' }],
    ['fractional id', { id: 7.5 }],
    ['numeric firstName', { firstName: 1 }],
    ['numeric lastName', { lastName: 1 }],
    ['numeric dateOfBirth', { dateOfBirth: 19950412 }],
    ['numeric contactPhone', { contactPhone: 600111222 }],
    ['numeric contactEmail', { contactEmail: 1 }],
    ['numeric createdAt', { createdAt: 1 }],
    ['null updatedAt', { updatedAt: null }],
  ])('rejects %s', (_case, patch) => {
    expect(userResponseSchema.safeParse({ ...validUser, ...patch }).success).toBe(false)
  })

  it.each([null, 'user', 42, []])('rejects %j', (value) => {
    expect(userResponseSchema.safeParse(value).success).toBe(false)
  })
})
