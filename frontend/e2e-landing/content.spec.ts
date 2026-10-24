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

const REPO_URL = 'https://github.com/RenzoRamosDEV/Booqui-TFG'
const DEPLOYED_APP_HOSTS =
  /(github\.io|vercel\.app|netlify\.app|onrender\.com|herokuapp\.com|pages\.dev)$/

test.describe('landing content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
  })

  test('has exactly one h1, reading Booqi', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Booqi')
  })

  test('sections appear in order, each with a heading, followed by the footer', async ({
    page,
  }) => {
    const sections = await page.locator('main > section, body > footer').evaluateAll((nodes) =>
      nodes.map((node) => ({
        tag: node.tagName.toLowerCase(),
        heading: node.querySelector('h1, h2')?.textContent?.trim() ?? '',
      })),
    )
    expect(sections.map((section) => section.heading)).toEqual([
      'Booqi',
      expect.stringMatching(/^Qué es/),
      expect.stringMatching(/^Capturas/),
      expect.stringMatching(/^Arquitectura/),
      expect.stringMatching(/^Stack/),
      expect.stringMatching(/^Ejecútalo en local/),
      expect.any(String),
    ])
    expect(sections.at(-1)?.tag).toBe('footer')
    expect(sections.at(-1)?.heading).not.toBe('')
  })

  test('links to the repository from the hero and from the footer', async ({ page }) => {
    await expect(page.locator(`#inicio a[href="${REPO_URL}"]`).first()).toBeVisible()
    await expect(page.locator(`footer a[href="${REPO_URL}"]`).first()).toBeVisible()
  })

  test('has no demo link or button and no link to a deployed app', async ({ page }) => {
    const controls = await page.locator('a, button').evaluateAll((nodes) =>
      nodes.map((node) => ({
        text: `${node.textContent ?? ''} ${node.getAttribute('aria-label') ?? ''}`,
        href: node.getAttribute('href') ?? '',
      })),
    )
    expect(controls.filter((c) => /demo/i.test(c.text) || /demo/i.test(c.href))).toEqual([])
    const deployed = controls
      .filter((c) => /^https?:/.test(c.href))
      .filter((c) => DEPLOYED_APP_HOSTS.test(new URL(c.href).hostname))
    expect(deployed).toEqual([])
  })

  test('credits the author in the footer', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('RenzoRamosDEV')
  })

  test('the architecture diagram is an inline, accessible SVG with every node', async ({
    page,
  }) => {
    const diagram = page.locator('#arquitectura svg[role="img"]')
    await expect(diagram).toHaveCount(1)
    await expect(diagram).toHaveAccessibleName(/arquitectura/i)
    await expect(diagram).toHaveAccessibleDescription(
      /Navegador.*nginx.*user-service.*event-service.*booking-service.*payment-service.*MySQL/s,
    )
    const labels = await diagram.locator('text').allTextContents()
    for (const label of [
      'Navegador',
      'nginx',
      'user-service',
      'event-service',
      'booking-service',
      'payment-service',
      'MySQL',
    ]) {
      expect(labels.some((text) => text.includes(label))).toBe(true)
    }
  })

  test('diagram connectors follow the theme', async ({ page }) => {
    const connector = page.locator('#arquitectura .diagram-link').first()
    const stroke = () => connector.evaluate((element) => getComputedStyle(element).stroke)
    const before = await stroke()
    await page.getByRole('button', { name: /^Cambiar a tema/ }).click()
    expect(await stroke()).not.toBe(before)
  })

  test('run-locally commands match the repository', async ({ page }) => {
    const section = page.locator('#ejecutar')
    const commands = (await section.locator('pre').allTextContents()).join('\n')
    expect(commands).toContain('cp infra/.env.example infra/.env')
    expect(commands).toContain(
      'docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.override.yml --env-file infra/.env up -d --build',
    )
    await expect(section).toContainText('http://localhost')
  })

  test('diagram labels stay readable (at least 12 px)', async ({ page }) => {
    const sizes = await page.locator('#arquitectura svg[role="img"] text').evaluateAll((nodes) =>
      nodes.map((node) => {
        const scale = node instanceof SVGGraphicsElement ? (node.getScreenCTM()?.a ?? 0) : 0
        return parseFloat(getComputedStyle(node).fontSize) * scale
      }),
    )
    expect(sizes.length).toBeGreaterThan(0)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(12)
  })

  test('has no horizontal scroll', async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

const CURRENT_SCREENSHOT = /^[a-z-]+-(light|dark)-(640|1280)\.webp$/

test.describe('screenshots section', () => {
  test('shows light and dark screenshots with complete, lazy, responsive images', async ({
    page,
  }) => {
    await page.goto('./')
    const images = await page.locator('#capturas img').evaluateAll((nodes) =>
      nodes.map((node) => ({
        src: node.getAttribute('src') ?? '',
        alt: node.getAttribute('alt') ?? '',
        width: node.getAttribute('width') ?? '',
        height: node.getAttribute('height') ?? '',
        loading: node.getAttribute('loading'),
        decoding: node.getAttribute('decoding'),
        srcset: node.getAttribute('srcset') ?? '',
        caption: node.closest('figure')?.querySelector('figcaption')?.textContent ?? '',
      })),
    )

    expect(images.some((image) => image.src.includes('-light-'))).toBe(true)
    expect(images.some((image) => image.src.includes('-dark-'))).toBe(true)
    for (const image of images) {
      expect(image.alt.trim().length).toBeGreaterThan(10)
      expect(image.alt).not.toContain('.webp')
      expect(image.width).toMatch(/^\d+$/)
      expect(image.height).toMatch(/^\d+$/)
      expect(image.loading).toBe('lazy')
      expect(image.decoding).toBe('async')
      expect(image.srcset).toMatch(/\S+-640\.webp 640w/)
      expect(image.srcset).toMatch(/\S+-1280\.webp 1280w/)
      const fileName = image.src.split('/').at(-1) ?? ''
      if (!CURRENT_SCREENSHOT.test(fileName)) {
        expect(image.caption).toContain('captura de la versión anterior')
      }
    }
  })
})
