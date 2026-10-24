import { bookingWith } from '../../../test/fixtures/bookings'
import { paymentWith } from '../../../test/fixtures/payments'
import { reportModel } from './report-model'
import { buildSalesRows } from './sales'

const now = new Date('2030-06-15T10:30:00')
const rows = buildSalesRows(
  [
    paymentWith({
      id: 1,
      bookingId: 42,
      ticketQuantity: 2,
      totalPrice: 25,
      status: 'APPROVED',
      paymentDate: '2030-01-12T10:00:00',
    }),
    paymentWith({
      id: 2,
      bookingId: 42,
      ticketQuantity: 1,
      totalPrice: 12.5,
      status: 'REJECTED',
      paymentMethod: 'PAYPAL',
      paymentDate: '2030-01-11T10:00:00',
    }),
  ],
  [bookingWith({ id: 42, status: 'CONFIRMED' })],
)

describe('reportModel', () => {
  it('builds the event report (golden)', () => {
    expect(
      reportModel(rows, { kind: 'event', eventTitle: 'Jazz en Madrid' }, 'Mel García', now),
    ).toEqual({
      title: 'Informe de ventas · Jazz en Madrid',
      subtitle: '2 pagos',
      generatedAt: 'Generado el 15 de junio de 2030 a las 10:30',
      exportedBy: 'Exportado por Mel García',
      fileName: 'booqi-informe-jazz-en-madrid-2030-06-15.pdf',
      columns: ['Fecha', 'Cliente', 'Evento', 'Entradas', 'Importe', 'Método', 'Pago', 'Reserva'],
      rows: [
        [
          '12/01/2030',
          'Mel García',
          'Jazz en Madrid',
          '2',
          '25,00\u00a0€',
          'Tarjeta de crédito',
          'Aprobado',
          'Confirmada',
        ],
        [
          '11/01/2030',
          'Mel García',
          'Jazz en Madrid',
          '1',
          '12,50\u00a0€',
          'PayPal',
          'Rechazado',
          'Confirmada',
        ],
      ],
      totals: [
        ['Aprobado', '25,00\u00a0€'],
        ['Rechazado', '12,50\u00a0€'],
        ['Pendiente', '0,00\u00a0€'],
      ],
    })
  })

  it('titles a filtered report with its description', () => {
    const model = reportModel(
      rows,
      { kind: 'filtered', description: 'Pagos rechazados' },
      'Mel García',
      now,
    )

    expect(model).toMatchObject({
      title: 'Informe de ventas · Pagos rechazados',
      fileName: 'booqi-informe-pagos-rechazados-2030-06-15.pdf',
    })
  })

  it('shows a dash for a payment without booking', () => {
    const orphan = buildSalesRows([paymentWith({ bookingId: 999, eventId: 9 })], [])

    const model = reportModel(orphan, { kind: 'filtered', description: 'Todos' }, 'Mel García', now)

    expect(model!.rows[0]![7]).toBe('—')
  })

  it('uses the singular for one payment', () => {
    expect(
      reportModel(rows.slice(0, 1), { kind: 'filtered', description: 'Todos' }, 'Mel', now)!
        .subtitle,
    ).toBe('1 pago')
  })

  it('returns null without rows', () => {
    expect(
      reportModel([], { kind: 'event', eventTitle: 'Jazz en Madrid' }, 'Mel García', now),
    ).toBeNull()
  })
})
