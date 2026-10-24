import {
  THEME_STORAGE_KEY,
  applyTheme,
  currentTheme,
  getInitialTheme,
  readStoredTheme,
  resolveTheme,
} from './theme'

function stubMatchMedia(prefersDark: boolean) {
  const queries: string[] = []
  vi.stubGlobal('matchMedia', (query: string) => {
    queries.push(query)
    return { matches: prefersDark, media: query } as MediaQueryList
  })
  return queries
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
})

describe('resolveTheme', () => {
  it.each([
    ['light', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
    ['dark', true, 'dark'],
    [null, false, 'light'],
    [null, true, 'dark'],
    ['purple', false, 'light'],
    ['purple', true, 'dark'],
    ['', true, 'dark'],
    ['DARK', false, 'light'],
  ] as const)('stored %j with OS dark=%s resolves to %s', (stored, prefersDark, expected) => {
    expect(resolveTheme(stored, prefersDark)).toBe(expected)
  })
})

describe('readStoredTheme', () => {
  it('uses the booqi-theme key', () => {
    expect(THEME_STORAGE_KEY).toBe('booqi-theme')
  })

  it('returns the stored value', () => {
    localStorage.setItem('booqi-theme', 'dark')

    expect(readStoredTheme()).toBe('dark')
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredTheme()).toBeNull()
  })

  it('treats a throwing storage as absent', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    expect(readStoredTheme()).toBeNull()
  })
})

describe('getInitialTheme', () => {
  it('asks the OS for the dark color scheme', () => {
    const queries = stubMatchMedia(true)

    expect(getInitialTheme()).toBe('dark')
    expect(queries).toEqual(['(prefers-color-scheme: dark)'])
  })

  it('prefers the stored choice over the OS', () => {
    stubMatchMedia(true)
    localStorage.setItem('booqi-theme', 'light')

    expect(getInitialTheme()).toBe('light')
  })

  it('falls back to light without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(getInitialTheme()).toBe('light')
  })
})

describe('applyTheme', () => {
  it('adds the dark class and dark color-scheme', () => {
    applyTheme('dark')

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('removes the dark class and sets light color-scheme', () => {
    document.documentElement.classList.add('dark', 'keep')

    applyTheme('light')

    expect(document.documentElement.className).toBe('keep')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })
})

describe('currentTheme', () => {
  it.each([
    ['dark', 'dark'],
    ['', 'light'],
  ])('reads %j class as %s', (className, expected) => {
    document.documentElement.className = className

    expect(currentTheme()).toBe(expected)
  })
})
