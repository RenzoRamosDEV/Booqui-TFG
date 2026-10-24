import { defineConfig } from 'vitest/config'
import base from './vite.config'

// Only the unit suites of the demo logic (no rendered pages), so a mutation run stays under three minutes.
// Spread rather than mergeConfig: mergeConfig would append to the base include list.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['src/mocks/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'src/mocks/mocks.test.ts'],
  },
})
