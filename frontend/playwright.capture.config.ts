import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testDir: './e2e/capture',
  testMatch: '**/*.capture.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
})
