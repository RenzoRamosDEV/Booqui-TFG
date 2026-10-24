import { toApiError } from './api-error'
import { userMessage } from './error-messages'

export type ServerError = { type: 'server'; message: string }

export type ServerErrorOptions<Field extends string> = {
  fields: readonly Field[]
  statusFields?: Partial<Record<number, { field: Field; message: string }>>
  statusMessages?: Partial<Record<number, string>>
}

type SetError<Field extends string> = (name: Field | 'root.server', error: ServerError) => void

export function applyServerErrors<Field extends string>(
  error: unknown,
  setError: SetError<Field>,
  { fields, statusFields = {}, statusMessages = {} }: ServerErrorOptions<Field>,
): void {
  const apiError = toApiError(error)
  const statusField = statusFields[apiError.status]
  if (statusField) {
    setError(statusField.field, { type: 'server', message: statusField.message })
    return
  }
  const fieldErrors = Object.entries(apiError.fieldErrors ?? {})
  const known = fieldErrors.filter(([field]) => (fields as readonly string[]).includes(field))
  for (const [field, message] of known) setError(field as Field, { type: 'server', message })
  const unknown = fieldErrors.find(([field]) => !(fields as readonly string[]).includes(field))
  if (known.length > 0 && !unknown) return
  const message = unknown?.[1] ?? statusMessages[apiError.status] ?? userMessage(apiError)
  setError('root.server', { type: 'server', message })
}
