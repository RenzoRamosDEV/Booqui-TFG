import { changedFields } from './diff'

const original = { firstName: 'Mel', contactPhone: null as string | null, price: 12.5 }

describe('changedFields', () => {
  it('returns an empty object when nothing changed', () => {
    expect(changedFields(original, { firstName: 'Mel', contactPhone: '', price: 12.5 })).toEqual({})
  })

  it('returns only the changed scalar', () => {
    expect(changedFields(original, { firstName: 'Ana', contactPhone: '', price: 12.5 })).toEqual({
      firstName: 'Ana',
    })
  })

  it('detects a changed number', () => {
    expect(changedFields(original, { firstName: 'Mel', contactPhone: '', price: 25 })).toEqual({
      price: 25,
    })
  })

  it('sends a phone set for the first time', () => {
    expect(
      changedFields(original, { firstName: 'Mel', contactPhone: '+34600111222', price: 12.5 }),
    ).toEqual({ contactPhone: '+34600111222' })
  })

  it('never sends empty strings, such as an empty optional password', () => {
    expect(changedFields({ firstName: 'Mel' }, { firstName: 'Mel', password: '' })).toEqual({})
    expect(changedFields({ contactPhone: '+34600111222' }, { contactPhone: '' })).toEqual({})
  })

  it('sends a new password missing from the original', () => {
    expect(
      changedFields({ firstName: 'Mel' }, { firstName: 'Mel', password: 'secreto123' }),
    ).toEqual({
      password: 'secreto123',
    })
  })

  it('ignores undefined values', () => {
    expect(changedFields(original, { firstName: undefined })).toStrictEqual({})
  })
})
