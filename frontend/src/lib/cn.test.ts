import { cn } from './cn'

describe('cn', () => {
  it('joins classes in order', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, '', 0, 'b')).toBe('a b')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, undefined)).toBe('')
  })
})
