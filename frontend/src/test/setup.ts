import { configure } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Overlay and page exit animations run on real time in jsdom; leave headroom on busy CI machines.
configure({ asyncUtilTimeout: 3000 })
