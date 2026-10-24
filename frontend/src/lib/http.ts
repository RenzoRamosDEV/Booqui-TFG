import axios, { type AxiosRequestConfig } from 'axios'
import { toApiError } from './api-error'

export type HttpClientOptions = {
  baseURL?: string
  adapter?: AxiosRequestConfig['adapter']
}

export function createHttpClient({
  baseURL = import.meta.env.VITE_API_BASE_URL ?? '',
  adapter,
}: HttpClientOptions = {}) {
  const client = axios.create({
    baseURL,
    adapter,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(toApiError(error)),
  )
  return client
}

export const http = createHttpClient()
