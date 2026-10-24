import type { UserResponse } from '../../../types/user'
import { SESSION_STORAGE_KEY, useSessionStore } from './session-store'

const user: UserResponse = {
  id: 7,
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '1995-04-12',
  contactPhone: null,
  contactEmail: 'mel@booqi.com',
  role: 'CUSTOMER',
  createdAt: '2026-01-10T09:30:00',
  updatedAt: '2026-01-10T09:30:00',
}

function stored(): unknown {
  const raw = localStorage.getItem('booqi-session')
  return raw === null ? null : JSON.parse(raw)
}

async function rehydrateFrom(raw: string) {
  localStorage.setItem('booqi-session', raw)
  await useSessionStore.persist.rehydrate()
}

beforeEach(() => {
  useSessionStore.setState({ user: null })
  localStorage.clear()
})

describe('useSessionStore', () => {
  it('uses the booqi-session key', () => {
    expect(SESSION_STORAGE_KEY).toBe('booqi-session')
  })

  it('starts without a session', () => {
    expect(useSessionStore.getState().user).toBeNull()
  })

  it('signIn keeps the user and stores it under booqi-session', () => {
    useSessionStore.getState().signIn(user)

    expect(useSessionStore.getState().user).toEqual(user)
    expect(stored()).toEqual({ state: { user }, version: 0 })
  })

  it('signOut clears the user and removes the stored session', () => {
    useSessionStore.getState().signIn(user)

    useSessionStore.getState().signOut()

    expect(useSessionStore.getState().user).toBeNull()
    expect(localStorage.getItem('booqi-session')).toBeNull()
  })

  it('restores a valid stored session on rehydrate', async () => {
    await rehydrateFrom(JSON.stringify({ state: { user }, version: 0 }))

    expect(useSessionStore.getState().user).toEqual(user)
    expect(stored()).toEqual({ state: { user }, version: 0 })
  })

  it('does not touch storage on rehydrate when nothing is stored', async () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')

    await useSessionStore.persist.rehydrate()

    expect(useSessionStore.getState().user).toBeNull()
    expect(removeItem).not.toHaveBeenCalled()
  })

  it('accepts a stored envelope without a user', async () => {
    await rehydrateFrom(JSON.stringify({ state: { user: null }, version: 0 }))

    expect(useSessionStore.getState().user).toBeNull()
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['a tampered role', JSON.stringify({ state: { user: { ...user, role: 'ROOT' } }, version: 0 })],
    [
      'a missing field',
      JSON.stringify({ state: { user: { ...user, id: undefined } }, version: 0 }),
    ],
    ['the old raw format', JSON.stringify(user)],
    ['a missing state', JSON.stringify({ version: 0 })],
    ['a JSON null', 'null'],
  ])('discards %s and removes the stored value', async (_case, raw) => {
    useSessionStore.setState({ user })

    await rehydrateFrom(raw)

    expect(useSessionStore.getState().user).toBeNull()
    expect(localStorage.getItem('booqi-session')).toBeNull()
  })
})
