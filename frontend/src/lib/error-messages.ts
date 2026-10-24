import type { ApiError } from './api-error'

export type MessageOverrides = Partial<Record<number, string>>

const defaultMessages: Record<number, string> = {
  0: 'No se pudo conectar con el servidor.',
  400: 'Datos inválidos. Revisa los campos.',
  401: 'No tienes autorización para esta acción.',
  404: 'No se ha encontrado lo que buscas.',
  409: 'Ya existe un registro con esos datos.',
  422: 'La operación no se puede completar.',
  503: 'El servicio no está disponible. Inténtalo más tarde.',
}

const genericMessage = 'Ha ocurrido un error inesperado.'

export function userMessage(error: ApiError, overrides: MessageOverrides = {}): string {
  if (error.detail.trim() !== '') return error.detail
  return overrides[error.status] ?? defaultMessages[error.status] ?? genericMessage
}
