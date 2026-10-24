import { SESSION_STORAGE_KEY } from '../../features/auth/hooks/session-store'
import { createDemoState } from './seed'
import { DEMO_STATE_KEY, loadDemoState, saveDemoState } from './storage'

const NOW = new Date(2026, 9, 24, 12, 0, 0)

class FakeStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  readonly items = new Map<string, string>()
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
}

const broken: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

describe('demo state storage', () => {
  it('round-trips a saved state', () => {
    const storage = new FakeStorage()
    const state = createDemoState(NOW)
    state.events[0]!.availableTickets = 1
    saveDemoState(storage, state)
    expect(loadDemoState(storage, NOW)).toEqual(state)
  })

  it('uses a key of its own, apart from the session and theme', () => {
    expect(DEMO_STATE_KEY).toMatch(/^booqi-\S+$/)
    expect([SESSION_STORAGE_KEY, 'booqi-theme']).not.toContain(DEMO_STATE_KEY)
  })

  it('saves under its own key', () => {
    const storage = new FakeStorage()
    saveDemoState(storage, createDemoState(NOW))
    expect([...storage.items.keys()]).toEqual([DEMO_STATE_KEY])
  })

  it('seeds a fresh state when nothing is stored', () => {
    expect(loadDemoState(new FakeStorage(), NOW)).toEqual(createDemoState(NOW))
  })

  it.each([
    ['invalid JSON', '{'],
    ['null', 'null'],
    ['a number', '42'],
    ['an object without the collections', '{"users":[]}'],
    ['collections that are not arrays', '{"users":{},"events":[],"bookings":[],"payments":[]}'],
  ])('seeds a fresh state when the stored value is %s', (_, raw) => {
    const storage = new FakeStorage()
    storage.setItem(DEMO_STATE_KEY, raw)
    expect(loadDemoState(storage, NOW)).toEqual(createDemoState(NOW))
  })

  it('works without usable storage', () => {
    expect(loadDemoState(broken, NOW)).toEqual(createDemoState(NOW))
    expect(() => saveDemoState(broken, createDemoState(NOW))).not.toThrow()
  })
})
