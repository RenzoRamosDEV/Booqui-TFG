import { centsToAmount, formatEuro, toCents } from './money'

describe('toCents', () => {
  it.each([
    [12.5, 1250],
    [0.1 + 0.2, 30],
    [19.99, 1999],
    [0, 0],
    [30, 3000],
  ])('%d € → %i cents', (price, cents) => {
    expect(toCents(price)).toBe(cents)
  })
})

describe('centsToAmount', () => {
  it.each([
    [2500, 25],
    [1999, 19.99],
    [0, 0],
  ])('%i cents → %d', (cents, amount) => {
    expect(centsToAmount(cents)).toBe(amount)
  })
})

describe('formatEuro', () => {
  it.each([
    [5500, '55,00 €'],
    [1250, '12,50 €'],
    [0, '0,00 €'],
    [1234567, '12.345,67 €'],
  ])('%i cents → %s', (cents, text) => {
    expect(formatEuro(cents)).toBe(text)
  })
})
