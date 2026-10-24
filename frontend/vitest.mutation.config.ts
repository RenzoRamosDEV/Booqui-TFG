import { defineConfig, mergeConfig } from 'vitest/config'
import base from './vite.config'

// Stryker only mutates logic (lib, api, hooks). Screen tests render whole pages and are too slow to
// re-run for every mutant, so the logic has to be killed by its own unit and hook tests.
export default mergeConfig(
  base,
  defineConfig({
    test: {
      exclude: ['**/node_modules/**', 'src/**/pages/**/*.test.tsx', 'src/app/**/*.test.tsx'],
    },
  }),
)
