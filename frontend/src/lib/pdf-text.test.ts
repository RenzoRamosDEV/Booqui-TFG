import { pdfSafe } from './pdf-text'

describe('pdfSafe', () => {
  it.each([
    ['Jazz en Málaga', 'Jazz en Málaga'],
    ['Año ¿qué? ¡sí! 12,50 €', 'Año ¿qué? ¡sí! 12,50 €'],
    ['Fiesta 🎉', 'Fiesta ?'],
    ['東京', '??'],
    ['línea\nnueva', 'línea?nueva'],
    ['— – … “ ” ‘ ’ •', '— – … “ ” ‘ ’ •'],
  ])('%j → %j', (input, output) => {
    expect(pdfSafe(input)).toBe(output)
  })

  it('composes decomposed accents before checking', () => {
    expect(pdfSafe('México')).toBe('México')
  })
})
