import { ApiError } from './api-error'
import { applyServerErrors } from './form-errors'

type Field = 'contactEmail' | 'dateOfBirth' | 'password'

function setup() {
  const calls: Array<[string, { type: string; message: string }]> = []
  const setError = (name: string, error: { type: string; message: string }) => {
    calls.push([name, error])
  }
  return { calls, setError }
}

const fields: Field[] = ['contactEmail', 'dateOfBirth', 'password']

describe('applyServerErrors', () => {
  it('puts each known server field error under its field', () => {
    const { calls, setError } = setup()
    const error = new ApiError({
      status: 400,
      title: 'Bad Request',
      detail: 'Validation failed',
      fieldErrors: {
        dateOfBirth: 'La fecha de nacimiento debe ser una fecha pasada',
        password: 'La contraseña debe tener al menos 8 caracteres',
      },
    })

    applyServerErrors(error, setError, { fields })

    expect(calls).toEqual([
      [
        'dateOfBirth',
        { type: 'server', message: 'La fecha de nacimiento debe ser una fecha pasada' },
      ],
      ['password', { type: 'server', message: 'La contraseña debe tener al menos 8 caracteres' }],
    ])
  })

  it('sends field errors for unknown fields to the root message', () => {
    const { calls, setError } = setup()
    const error = new ApiError({
      status: 400,
      title: '',
      detail: 'Validation failed',
      fieldErrors: { role: 'El rol debe ser ADMIN o CUSTOMER' },
    })

    applyServerErrors(error, setError, { fields })

    expect(calls).toEqual([
      ['root.server', { type: 'server', message: 'El rol debe ser ADMIN o CUSTOMER' }],
    ])
  })

  it('maps a status to a field with a fixed message', () => {
    const { calls, setError } = setup()
    const error = new ApiError({
      status: 409,
      title: '',
      detail: 'User with contactEmail x already exists',
    })

    applyServerErrors(error, setError, {
      fields,
      statusFields: { 409: { field: 'contactEmail', message: 'Este email ya está registrado.' } },
    })

    expect(calls).toEqual([
      ['contactEmail', { type: 'server', message: 'Este email ya está registrado.' }],
    ])
  })

  it('forces a root message for a status, ignoring the backend detail', () => {
    const { calls, setError } = setup()
    const error = new ApiError({ status: 401, title: '', detail: 'Invalid email or password' })

    applyServerErrors(error, setError, {
      fields,
      statusMessages: { 401: 'Email o contraseña incorrectos.' },
    })

    expect(calls).toEqual([
      ['root.server', { type: 'server', message: 'Email o contraseña incorrectos.' }],
    ])
  })

  it('otherwise shows the ApiError user message under root', () => {
    const { calls, setError } = setup()

    applyServerErrors(new ApiError({ status: 503, title: '', detail: '' }), setError, { fields })

    expect(calls).toEqual([
      [
        'root.server',
        { type: 'server', message: 'El servicio no está disponible. Inténtalo más tarde.' },
      ],
    ])
  })

  it('shows the backend detail when present', () => {
    const { calls, setError } = setup()

    applyServerErrors(new ApiError({ status: 422, title: '', detail: 'Regla rota' }), setError, {
      fields,
    })

    expect(calls).toEqual([['root.server', { type: 'server', message: 'Regla rota' }]])
  })

  it('shows a generic message for errors that are not ApiError', () => {
    const { calls, setError } = setup()

    applyServerErrors(new Error('zod drift'), setError, { fields })

    expect(calls).toEqual([
      ['root.server', { type: 'server', message: 'Ha ocurrido un error inesperado.' }],
    ])
  })
})
