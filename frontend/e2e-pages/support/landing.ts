import type { Page } from '@playwright/test'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const landingDir = resolve('../landing')

export const targets = [
  { name: 'subpath /Booqui-TFG/', url: './' },
  { name: 'file://', url: pathToFileURL(resolve(landingDir, 'index.html')).href },
] as const

/** Scrolls one viewport at a time so IntersectionObserver and lazy images fire on every section. */
export async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    const pause = () => new Promise((done) => setTimeout(done, 60))
    while (window.scrollY + window.innerHeight < document.documentElement.scrollHeight - 1) {
      window.scrollBy(0, window.innerHeight * 0.8)
      await pause()
    }
  })
}
