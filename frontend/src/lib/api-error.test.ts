import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { problemDetails } from './__fixtures__/problem-details'
import { ApiError, toApiError } from './api-error'

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response: AxiosResponse = { status, statusText: '', data, headers: {}, config }
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    config,
    {},
    response,
  )
}

describe('ApiError', () => {
  it('is an Error carrying status, title, detail and field errors', () => {
    const error = new ApiError({
      status: 400,
      title: 'Bad Request',
      detail: 'Validation failed',
      fieldErrors: { a: 'b' },
    })

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('Validation failed')
    expect(error.fieldErrors).toEqual({ a: 'b' })
  })

  it.each([
    [{ status: 404, title: 'Not Found', detail: '' }, 'Not Found'],
    [{ status: 502, title: '', detail: '' }, 'HTTP 502'],
  ])('falls back to title, then status, for the message of %j', (init, message) => {
    expect(new ApiError(init).message).toBe(message)
  })
})

describe('toApiError', () => {
  it('maps a validation ProblemDetail with field errors', () => {
    const error = toApiError(httpError(400, problemDetails.validation))

    expect(error).toBeInstanceOf(ApiError)
    expect({ ...error, message: error.message }).toEqual({
      name: 'ApiError',
      status: 400,
      title: 'Bad Request',
      detail: 'Validation failed',
      fieldErrors: { ticketQuantity: 'La cantidad de tickets debe ser al menos 1' },
      message: 'Validation failed',
    })
  })

  it.each([
    ['filter', problemDetails.filter],
    ['unauthorized', problemDetails.unauthorized],
    ['notFound', problemDetails.notFound],
    ['conflict', problemDetails.conflict],
    ['business', problemDetails.business],
    ['unavailable', problemDetails.unavailable],
    ['unexpected', problemDetails.unexpected],
  ] as const)('maps the %s ProblemDetail without field errors', (_name, body) => {
    const error = toApiError(httpError(body.status, body))

    expect(error.status).toBe(body.status)
    expect(error.title).toBe(body.title)
    expect(error.detail).toBe(body.detail)
    expect(error.fieldErrors).toBeUndefined()
  })

  it('takes the HTTP status from the response, not the body', () => {
    expect(toApiError(httpError(409, { ...problemDetails.notFound })).status).toBe(409)
  })

  it('maps a request without response to status 0', () => {
    const config = { headers: new AxiosHeaders() }
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK', config, {}))

    expect(error.status).toBe(0)
    expect(error.title).toBe('')
    expect(error.detail).toBe('')
    expect(error.fieldErrors).toBeUndefined()
  })

  it('maps a timeout to status 0', () => {
    expect(toApiError(new AxiosError('timeout of 1ms exceeded', 'ECONNABORTED')).status).toBe(0)
  })

  it('keeps the status and an empty detail for an HTML body', () => {
    const error = toApiError(httpError(502, '<html><body>Bad Gateway</body></html>'))

    expect(error.status).toBe(502)
    expect(error.title).toBe('')
    expect(error.detail).toBe('')
  })

  it.each([
    [{ message: 'Legacy failure' }, 'Legacy failure'],
    [{ error: 'x' }, 'x'],
    [{ detail: 'd', message: 'm', error: 'e' }, 'd'],
    [{ detail: '  ', message: 'm', error: 'e' }, 'm'],
    [{ detail: '', message: '', error: 'e' }, 'e'],
    [{ detail: 42, message: 'm' }, 'm'],
    [{ detail: ' ', message: '\t', error: '' }, ''],
    [{}, ''],
    [null, ''],
  ])('takes detail from %j as %j', (body, detail) => {
    expect(toApiError(httpError(500, body)).detail).toBe(detail)
  })

  it.each([
    [{ title: 42 }, ''],
    [{ title: 'Gone' }, 'Gone'],
  ])('only accepts a string title from %j', (body, title) => {
    expect(toApiError(httpError(410, body)).title).toBe(title)
  })

  it.each([
    ['empty errors', []],
    ['errors not an array', 'oops'],
    [
      'malformed items',
      [
        null,
        'x',
        { field: 'a' },
        { message: 'm' },
        { field: 1, message: 'm' },
        { field: 'b', message: 2 },
      ],
    ],
  ])('ignores %s', (_case, errors) => {
    const error = toApiError(httpError(400, { ...problemDetails.filter, errors }))

    expect(error.fieldErrors).toBeUndefined()
  })

  it('keeps only the well-formed field errors', () => {
    const error = toApiError(
      httpError(400, {
        errors: [{ field: 'a', message: 'ok' }, { field: 'b' }, { field: 'c', message: 'ok c' }],
      }),
    )

    expect(error.fieldErrors).toEqual({ a: 'ok', c: 'ok c' })
  })

  it('returns an existing ApiError unchanged', () => {
    const original = new ApiError({ status: 404, title: 'Not Found', detail: 'x' })

    expect(toApiError(original)).toBe(original)
  })

  it.each([
    ['an Error', new TypeError('boom')],
    ['a string', 'boom'],
    ['undefined', undefined],
  ])('maps %s that is not an HTTP failure to status -1', (_case, value) => {
    const error = toApiError(value)

    expect(error.status).toBe(-1)
    expect(error.title).toBe('')
    expect(error.detail).toBe('')
  })
})
