// MOCK: arranque de la demo de GitHub Pages, que no tiene backend: conecta el cliente HTTP al backend
// en memoria y guarda su estado en la pestaña.
import type { AxiosInstance } from 'axios'
import { http } from '../../lib/http'
import { createDemoAdapter } from './adapter'
import { loadDemoState, saveDemoState, type DemoStorage } from './storage'

export type InstallDemoOptions = {
  client?: AxiosInstance
  storage: DemoStorage
  now: Date
  delayMs?: number
}

export function installDemo({ client = http, storage, now, delayMs = 250 }: InstallDemoOptions) {
  const state = loadDemoState(storage, now)
  client.defaults.adapter = createDemoAdapter(state, {
    delayMs,
    onChange: (changed) => saveDemoState(storage, changed),
  })
}
