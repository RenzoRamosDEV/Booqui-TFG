import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 10)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 10)
  })

  it('is 1 for equal colors', () => {
    expect(contrastRatio('#7C3AED', '#7C3AED')).toBe(1)
  })

  it.each([
    ['#767676', 4.5422],
    ['#777777', 4.4781],
  ])('does not round %s on white across the 4.5 boundary', (color, expected) => {
    expect(contrastRatio(color, '#FFFFFF')).toBeCloseTo(expected, 4)
  })

  it.each([
    ['#0A0A0A', 19.7981],
    ['#0B0B0B', 19.6826],
  ])('uses the right sRGB segment around the 0.04045 threshold for %s', (color, expected) => {
    expect(contrastRatio(color, '#FFFFFF')).toBeCloseTo(expected, 4)
  })

  it.each([
    ['#FF0000', 5.252],
    ['#00FF00', 15.304],
    ['#0000FF', 2.444],
  ])('weights the channels of %s per WCAG', (color, expected) => {
    expect(contrastRatio(color, '#000000')).toBeCloseTo(expected, 3)
  })

  it('accepts lowercase hex', () => {
    expect(contrastRatio('#7c3aed', '#ffffff')).toBeCloseTo(5.6986, 4)
  })

  it.each(['7C3AED', 'x#7C3AED', '#7C3AE', '#7C3AEDFF', '#GGGGGG', ''])('rejects %j', (color) => {
    expect(() => contrastRatio(color, '#FFFFFF')).toThrow(`Invalid hex color: ${color}`)
  })
})
