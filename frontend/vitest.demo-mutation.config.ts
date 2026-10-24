import { defineConfig } from 'vitest/config'
import base from './vite.config'

// Only the suites that exercise the demo logic, so a mutation run stays well under three minutes.
// Spread rather than mergeConfig: mergeConfig would append to the base include list.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['src/mocks/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', 'src/mocks/mocks.test.ts'],
  },
})
