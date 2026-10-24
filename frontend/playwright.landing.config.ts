import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.LANDING_PORT ?? 4190)

export default defineConfig({
  testDir: './e2e-landing',
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
    command: 'node scripts/serve-landing.mjs',
    port,
    env: { LANDING_PORT: String(port) },
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
