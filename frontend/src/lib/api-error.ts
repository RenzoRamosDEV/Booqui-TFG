import { isAxiosError } from 'axios'

export type FieldErrors = Record<string, string>

export type ApiErrorInit = {
  status: number
  title: string
  detail: string
  fieldErrors?: FieldErrors
}

export const NETWORK_ERROR_STATUS = 0
export const CLIENT_ERROR_STATUS = -1

export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly detail: string
  readonly fieldErrors?: FieldErrors

  constructor({ status, title, detail, fieldErrors }: ApiErrorInit) {
    super(detail || title || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.detail = detail
    this.fieldErrors = fieldErrors
  }
}

type Body = Record<string, unknown>

function isBody(value: unknown): value is Body {
  return value instanceof Object
}

function nonBlankString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function readFieldErrors(errors: unknown): FieldErrors | undefined {
  if (!Array.isArray(errors)) return undefined
  const entries = errors.flatMap((item: unknown) =>
    isBody(item) && typeof item.field === 'string' && typeof item.message === 'string'
      ? [[item.field, item.message] as const]
      : [],
  )
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!isAxiosError(error)) {
    return new ApiError({ status: CLIENT_ERROR_STATUS, title: '', detail: '' })
  }
  const response = error.response
  if (!response) return new ApiError({ status: NETWORK_ERROR_STATUS, title: '', detail: '' })

  const body: Body = isBody(response.data) ? response.data : {}
  return new ApiError({
    status: response.status,
    title: typeof body.title === 'string' ? body.title : '',
    detail:
      nonBlankString(body.detail) ??
      nonBlankString(body.message) ??
      nonBlankString(body.error) ??
      '',
    fieldErrors: readFieldErrors(body.errors),
  })
}
