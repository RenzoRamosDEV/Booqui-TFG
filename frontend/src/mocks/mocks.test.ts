const sources = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('./*.ts', { query: '?raw', import: 'default', eager: true }),
  ).filter(([file]) => !file.endsWith('.test.ts')),
)

describe('mocks', () => {
  it('exist', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0)
  })

  it.each(Object.entries(sources))(
    '%s is labelled with a // MOCK: comment naming its gap',
    (_file, source) => {
      expect(source).toMatch(/\/\/ MOCK: \S.+/)
    },
  )
})
