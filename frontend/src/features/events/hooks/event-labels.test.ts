import { availability, priceLabel } from './event-labels'

describe('availability', () => {
  it.each([
    [0, { label: 'Agotado', tone: 'danger', soldOut: true }],
    [1, { label: 'Última entrada', tone: 'warning', soldOut: false }],
    [2, { label: 'Últimas 2 entradas', tone: 'warning', soldOut: false }],
    [10, { label: 'Últimas 10 entradas', tone: 'warning', soldOut: false }],
    [11, { label: '11 entradas disponibles', tone: 'success', soldOut: false }],
    [500, { label: '500 entradas disponibles', tone: 'success', soldOut: false }],
    [-1, { label: 'Agotado', tone: 'danger', soldOut: true }],
  ])('%i tickets', (tickets, expected) => {
    expect(availability(tickets)).toEqual(expected)
  })
})

describe('priceLabel', () => {
  it.each([
    [0, 'Gratis'],
    [12.5, '12,50 €'],
    [0.01, '0,01 €'],
  ])('%d → %s', (price, label) => {
    expect(priceLabel(price)).toBe(label)
  })
})
