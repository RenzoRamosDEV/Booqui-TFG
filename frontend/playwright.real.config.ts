import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_REAL_BASE_URL ?? 'http://localhost:8088'

export default defineConfig({
  testDir: './e2e-real',
  globalSetup: './e2e-real/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
