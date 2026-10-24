import html from '../../index.html?raw'
import { resolveTheme } from '../lib/theme'

function inlineThemeScript(): string {
  const match = /<script>([\s\S]*?)<\/script>/.exec(html)
  if (!match) throw new Error('index.html has no inline script')
  return match[1]!
}

function runScript(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
    media: query,
  }))
  new Function(inlineThemeScript())()
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
})

describe('inline no-flash theme script', () => {
  it('runs in <head> before any stylesheet or module script', () => {
    const head = html.slice(0, html.indexOf('</head>'))
    const scriptAt = head.indexOf('<script>')

    expect(scriptAt).toBeGreaterThan(-1)
    expect(head.indexOf('<link rel="stylesheet"', 0)).toSatisfy(
      (at: number) => at === -1 || at > scriptAt,
    )
    expect(html.indexOf('type="module"')).toBeGreaterThan(scriptAt)
  })

  const cases: Array<[string | null, boolean]> = [
    ['light', false],
    ['light', true],
    ['dark', false],
    ['dark', true],
    [null, false],
    [null, true],
    ['purple', false],
    ['purple', true],
  ]

  it.each(cases)('stored %j with OS dark=%s matches resolveTheme', (stored, prefersDark) => {
    if (stored !== null) localStorage.setItem('booqi-theme', stored)

    runScript(prefersDark)

    const expected = resolveTheme(stored, prefersDark)
    expect(document.documentElement.classList.contains('dark')).toBe(expected === 'dark')
    expect(document.documentElement.style.colorScheme).toBe(expected)
  })

  it('treats unreadable storage as no choice', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })

    runScript(true)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
