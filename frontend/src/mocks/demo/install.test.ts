import axios from 'axios'
import { DEMO_STATE_KEY } from './storage'
import { installDemo } from './install'

const NOW = new Date(2026, 9, 24, 12, 0, 0)

function fakeStorage() {
  const items = new Map<string, string>()
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

describe('installDemo', () => {
  it('answers the client from the seeded demo backend', async () => {
    const client = axios.create()
    installDemo({ client, storage: fakeStorage(), now: NOW, delayMs: 0 })
    const { data } = await client.get('/api/v1/events')
    expect(data.length).toBeGreaterThan(0)
  })

  it('saves every change and restores it on the next install', async () => {
    const storage = fakeStorage()
    const first = axios.create()
    installDemo({ client: first, storage, now: NOW, delayMs: 0 })
    await first.delete('/api/v1/events/101')
    expect(storage.items.get(DEMO_STATE_KEY)).toContain('"events"')

    const second = axios.create()
    installDemo({ client: second, storage, now: NOW, delayMs: 0 })
    const ids = (await second.get('/api/v1/events')).data.map((event: { id: number }) => event.id)
    expect(ids).not.toContain(101)
  })
})
