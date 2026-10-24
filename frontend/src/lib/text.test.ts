import { normalize } from './text'

describe('normalize', () => {
  it.each([
    ['Gastronomía', 'gastronomia'],
    ['GASTRONOMIA', 'gastronomia'],
    ['  Jazz  ', 'jazz'],
    ['Música', 'musica'],
    ['España', 'espana'],
    ['ESPAÑA', 'espana'],
    ['Ça Über', 'ca uber'],
    ['', ''],
    ['   ', ''],
  ])('%j → %j', (input, output) => {
    expect(normalize(input)).toBe(output)
  })

  it('makes accented and plain spellings equal', () => {
    expect(normalize('Educación')).toBe(normalize('educacion'))
  })
})
