import { normalize, slugify } from './text'

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

describe('slugify', () => {
  it.each([
    ['Jazz en Madrid', 'jazz-en-madrid'],
    ['¡Gastronomía & Vino!', 'gastronomia-vino'],
    ['  Rock -- 2030  ', 'rock-2030'],
    ['Año Nuevo', 'ano-nuevo'],
    ['???', ''],
  ])('%j → %j', (input, slug) => {
    expect(slugify(input)).toBe(slug)
  })
})
