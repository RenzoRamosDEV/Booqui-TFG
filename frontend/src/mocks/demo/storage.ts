// MOCK: persistencia por pestaña de la demo de GitHub Pages, que no tiene backend: lo que se compra
// o se edita sobrevive a una recarga pero no sale del navegador.
import type { MockState } from '../mock-backend'
import { createDemoState } from './seed'

export const DEMO_STATE_KEY = 'booqi-demo-state'

type DemoStorage = Pick<Storage, 'getItem' | 'setItem'>

const COLLECTIONS = ['users', 'events', 'bookings', 'payments'] as const

export function loadDemoState(storage: DemoStorage, now: Date): MockState {
  try {
    const stored = JSON.parse(String(storage.getItem(DEMO_STATE_KEY))) as Record<string, unknown>
    if (COLLECTIONS.every((key) => Array.isArray(stored[key]))) return stored as MockState
  } catch {
    // Blocked storage or a corrupt value: start again from a fresh seed.
  }
  return createDemoState(now)
}

export function saveDemoState(storage: DemoStorage, state: MockState): void {
  try {
    storage.setItem(DEMO_STATE_KEY, JSON.stringify(state))
  } catch {
    // A full or blocked storage only costs persistence across reloads; the demo keeps working.
  }
}
