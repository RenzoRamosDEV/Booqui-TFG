import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getErrorMessage } from './errorMessage.js'

const FALLBACK = 'Error procesando el pago.'
const withBody = (data) => ({ response: { data } })

const cases = [
  ['detail only', withBody({ type: 'about:blank', status: 422, detail: 'Booking 5 is not pending' }), 'Booking 5 is not pending'],
  ['detail wins over message', withBody({ detail: 'From detail', message: 'From message' }), 'From detail'],
  ['message only', withBody({ message: 'Legacy failure' }), 'Legacy failure'],
  ['error only', withBody({ error: 'Bad Request' }), 'Bad Request'],
  ['blank detail falls through to message', withBody({ detail: '   ', message: 'From message' }), 'From message'],
  ['non-string detail falls through to message', withBody({ detail: { nested: true }, message: 'From message' }), 'From message'],
  ['non-string detail with nothing else uses fallback', withBody({ detail: 42 }), FALLBACK],
  ['all blank uses fallback', withBody({ detail: '', message: ' ', error: '\t' }), FALLBACK],
  ['string body uses fallback', withBody('Internal Server Error'), FALLBACK],
  ['no response uses fallback', new Error('Network Error'), FALLBACK],
  ['null err uses fallback', null, FALLBACK],
  ['undefined err uses fallback', undefined, FALLBACK],
]

for (const [name, err, expected] of cases) {
  test(`getErrorMessage: ${name}`, () => {
    assert.equal(getErrorMessage(err, FALLBACK), expected)
  })
}
