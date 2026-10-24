// MOCK: adaptador de Axios de la demo de GitHub Pages, que no tiene backend: las peticiones a
// /api/v1 se contestan en el navegador con el backend en memoria, sin salir a la red.
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { handleMockRequest, type MockState } from '../mock-backend'

export type DemoAdapterOptions = {
  delayMs?: number
  onChange?: (state: MockState) => void
}

function queryOf(config: InternalAxiosRequestConfig): URLSearchParams {
  const params = (config.params ?? {}) as Record<string, string | number>
  return new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))
}

function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : undefined
}

export function createDemoAdapter(
  state: MockState,
  { delayMs = 0, onChange }: DemoAdapterOptions = {},
): AxiosAdapter {
  return async (config) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    const reply = handleMockRequest(state, {
      method: String(config.method).toUpperCase(),
      path: new URL(String(config.url), 'http://demo.invalid').pathname,
      query: queryOf(config),
      body: bodyOf(config),
    })
    onChange?.(state)
    const response = {
      status: reply.status,
      statusText: String(reply.status),
      data: reply.json,
      headers: {},
      config,
    }
    if (reply.status < 400) return response
    throw new AxiosError(
      `Request failed with status code ${reply.status}`,
      AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    )
  }
}
