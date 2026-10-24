import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { landingDir } from './support/landing'

test.describe('landing files', () => {
  test('tokens.css is a byte copy of the app tokens', () => {
    const landingTokens = readFileSync(join(landingDir, 'css/tokens.css'))
    const appTokens = readFileSync('src/styles/tokens.css')
    expect(landingTokens.equals(appTokens)).toBe(true)
  })

  test('landing has no package manifest, lockfile or node_modules', () => {
    const forbidden = new Set([
      'package.json',
      'package-lock.json',
      'npm-shrinkwrap.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'bun.lockb',
      'node_modules',
    ])
    const entries = readdirSync(landingDir, { recursive: true }).map(String)
    expect(entries).toContain('index.html')
    expect(entries.filter((entry) => forbidden.has(basename(entry)))).toEqual([])
  })
})
