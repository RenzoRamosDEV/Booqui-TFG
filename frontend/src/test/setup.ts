import { configure } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Overlay and page exit animations run on real time in jsdom; leave headroom on busy CI machines.
configure({ asyncUtilTimeout: 3000 })

afterEach(async () => {
  const [{ useCartStore }, { useSessionStore }] = await Promise.all([
    import('../features/cart/hooks/cart-store'),
    import('../features/auth/hooks/session-store'),
  ])
  // Only touch stores that changed: a reset still persists, and some tests make storage throw.
  if (useCartStore.getState().lines.length > 0) useCartStore.setState({ lines: [] })
  if (useSessionStore.getState().user) useSessionStore.setState({ user: null })
})
