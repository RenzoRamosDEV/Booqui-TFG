import css from './tokens.css?raw'
import { contrastRatio } from '../lib/contrast'

type Tokens = Record<string, string>

function readBlock(selector: string): Tokens {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Missing ${selector} block`)
  const body = css.slice(start, css.indexOf('}', start))
  const tokens: Tokens = {}
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const trimmed = value!.trim()
    tokens[name!] = trimmed.startsWith('#') ? trimmed.toUpperCase() : trimmed
  }
  return tokens
}

const light = readBlock(':root')
const dark = { ...light, ...readBlock('.dark') }

function resolve(tokens: Tokens, name: string): string {
  const value = tokens[name]
  if (value === undefined) throw new Error(`Missing token ${name}`)
  const ref = /^var\((--[\w-]+)\)$/.exec(value)
  return ref ? resolve(tokens, ref[1]!) : value
}

describe('design tokens', () => {
  it('defines the light base values', () => {
    expect({
      bg: light['--bg'],
      bgElevated: light['--bg-elevated'],
      surface: light['--surface'],
      fg: light['--fg'],
      fgMuted: light['--fg-muted'],
      border: light['--border'],
      primary: light['--primary'],
      primaryFg: light['--primary-fg'],
      ring: light['--ring'],
    }).toEqual({
      bg: '#FFFFFF',
      bgElevated: '#FAF8FF',
      surface: '#FFFFFF',
      fg: '#1A1523',
      fgMuted: '#6B6478',
      border: '#E9E4F5',
      primary: 'var(--brand-600)',
      primaryFg: '#FFFFFF',
      ring: 'var(--brand-500)',
    })
  })

  it('anchors the brand scale on #7C3AED', () => {
    expect(resolve(light, '--primary')).toBe('#7C3AED')
  })

  it('defines all eleven brand steps', () => {
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    for (const step of steps) {
      expect(light[`--brand-${step}`]).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('overrides the dark base values and keeps the ring', () => {
    expect({
      bg: dark['--bg'],
      bgElevated: dark['--bg-elevated'],
      surface: dark['--surface'],
      fg: dark['--fg'],
      fgMuted: dark['--fg-muted'],
      border: dark['--border'],
      primary: dark['--primary'],
      primaryFg: dark['--primary-fg'],
      ring: dark['--ring'],
    }).toEqual({
      bg: '#15131A',
      bgElevated: '#1C1922',
      surface: '#221E2B',
      fg: '#F3F0FA',
      fgMuted: '#A49DB5',
      border: '#2F2A3A',
      primary: 'var(--brand-400)',
      primaryFg: '#15131A',
      ring: 'var(--brand-500)',
    })
  })

  const pairs: Array<[string, string]> = [
    ['--fg', '--bg'],
    ['--fg', '--bg-elevated'],
    ['--fg', '--surface'],
    ['--fg-muted', '--bg'],
    ['--fg-muted', '--bg-elevated'],
    ['--fg-muted', '--surface'],
    ['--primary-fg', '--primary'],
  ]

  for (const [theme, tokens] of [
    ['light', light],
    ['dark', dark],
  ] as const) {
    it.each(pairs)(`${theme}: %s on %s meets AA (>= 4.5)`, (fg, bg) => {
      expect(contrastRatio(resolve(tokens, fg), resolve(tokens, bg))).toBeGreaterThanOrEqual(4.5)
    })
  }
})
