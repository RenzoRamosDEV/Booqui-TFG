import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PAGES_PORT ?? 4190)

export default defineConfig({
  testDir: './e2e-pages',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${port}/Booqui-TFG/`,
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 412, height: 823 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    // Builds the demo first so the assembled site (landing + demo/) is what gets tested, as on Pages.
    command: 'npm run build:demo && node scripts/serve-pages.mjs',
    port,
    env: { PAGES_PORT: String(port) },
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
