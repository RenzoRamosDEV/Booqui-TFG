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

  test('links to the demo from the section nav and the hero', async ({ page }) => {
    // The section nav is hidden below 60rem, so query it by markup; the hero link covers phones.
    const navLinks = page.locator('nav.site-nav a')
    await expect(navLinks).toHaveText([
      'Qué es',
      'Capturas',
      'Arquitectura',
      'Stack',
      'Ejecutar',
      'Documentación',
      'Ver demo',
    ])
    await expect(navLinks.last()).toHaveAttribute('href', 'demo/')
    const hero = page.locator('#inicio').getByRole('link', { name: 'Ver demo' })
    await expect(hero).toBeVisible()
    await expect(hero).toHaveAttribute('href', 'demo/')
  })

  test('has no link to a deployed app outside the site', async ({ page }) => {
    const hrefs = await page
      .locator('a')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''))
    const deployed = hrefs
      .filter((href) => /^https?:/.test(href))
      .filter((href) => DEPLOYED_APP_HOSTS.test(new URL(href).hostname))
    expect(deployed).toEqual([])
  })

  test('header and footer brand marks show the app logo', async ({ page }) => {
    const logos = page.locator('.brand__mark img')
    await expect(logos).toHaveCount(2)
    for (const logo of await logos.all()) {
      await expect(logo).toHaveAttribute('src', 'assets/logo.png')
      await expect(logo).toHaveAttribute('alt', '')
      expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    }
    expect(readFileSync(join(landingDir, 'assets/logo.png')).length).toBeLessThan(20_000)
  })

  test('credits the author in the footer', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('RenzoRamosDEV')
  })

  test('links to the documentation from the section nav and the footer', async ({ page }) => {
    await expect(page.locator('nav.site-nav a', { hasText: 'Documentación' })).toHaveAttribute(
      'href',
      'docs.html',
    )
    await expect(page.locator('footer a[href="docs.html"]')).toBeVisible()
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

test.describe('documentation page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./docs.html')
  })

  test('has exactly one h1 and marks itself as the current page in the nav', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText('Booqi')
    await expect(page.locator('nav.site-nav a[aria-current="page"]')).toHaveText('Documentación')
  })

  test('every table of contents entry points to an existing section', async ({ page }) => {
    const targets = await page
      .locator('[data-toc] a')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href') ?? ''))
    expect(targets.length).toBeGreaterThan(15)
    for (const target of targets) {
      expect(target).toMatch(/^#[a-z-]+$/)
      await expect(page.locator(`section${target}`)).toHaveCount(1)
    }
  })

  test('covers the app, the services and the project', async ({ page }) => {
    const headings = await page.locator('.doc-section h2').allTextContents()
    for (const heading of [
      'Probar la demo',
      'Carrito y pago',
      'Panel de administración',
      'Microservicios y API',
      'Flujo de una compra',
      'Infraestructura',
      'Pruebas y calidad',
      'Limitaciones conocidas',
    ]) {
      expect(headings).toContain(heading)
    }
    for (const service of ['user-service', 'event-service', 'booking-service', 'payment-service']) {
      await expect(page.locator('#servicios')).toContainText(service)
    }
  })

  test('has no horizontal scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
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
