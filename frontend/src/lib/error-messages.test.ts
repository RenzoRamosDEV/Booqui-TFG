import { ApiError } from './api-error'
import { userMessage } from './error-messages'

function apiError(status: number, detail = '') {
  return new ApiError({ status, title: '', detail })
}

describe('userMessage', () => {
  it('shows a non-blank detail as-is', () => {
    expect(userMessage(apiError(422, 'Booking 5 is not pending'))).toBe('Booking 5 is not pending')
  })

  it.each([
    [400, 'Datos inválidos. Revisa los campos.'],
    [401, 'No tienes autorización para esta acción.'],
    [404, 'No se ha encontrado lo que buscas.'],
    [409, 'Ya existe un registro con esos datos.'],
    [422, 'La operación no se puede completar.'],
    [503, 'El servicio no está disponible. Inténtalo más tarde.'],
    [0, 'No se pudo conectar con el servidor.'],
  ])('uses the default for status %i when detail is blank', (status, message) => {
    expect(userMessage(apiError(status))).toBe(message)
  })

  it.each([' ', '\n\t'])('treats whitespace detail %j as blank', (detail) => {
    expect(userMessage(apiError(503, detail))).toBe(
      'El servicio no está disponible. Inténtalo más tarde.',
    )
  })

  it.each([500, 502, 405, 418, -1])('uses the generic message for status %i', (status) => {
    expect(userMessage(apiError(status))).toBe('Ha ocurrido un error inesperado.')
  })

  it('lets a screen override the default for a status', () => {
    expect(userMessage(apiError(401), { 401: 'Email o contraseña incorrectos.' })).toBe(
      'Email o contraseña incorrectos.',
    )
  })

  it('lets a screen override the generic message for an unknown status', () => {
    expect(userMessage(apiError(500), { 500: 'Error al pagar.' })).toBe('Error al pagar.')
  })

  it('keeps the default when the override map has no entry for the status', () => {
    expect(userMessage(apiError(404), { 401: 'x' })).toBe('No se ha encontrado lo que buscas.')
  })

  it('never lets an override win over a non-blank detail', () => {
    expect(userMessage(apiError(401, 'Invalid email or password'), { 401: 'x' })).toBe(
      'Invalid email or password',
    )
  })
})
