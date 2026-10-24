import { formatLongDateTime, formatNumericDate, toLocalDay } from '../../../lib/dates'
import { formatEuro } from '../../../lib/money'
import { slugify } from '../../../lib/text'
import { bookingStatusLabel } from '../../bookings/hooks/group-bookings'
import { salesTotals, type SalesRow } from './sales'
import { paymentMethodLabel, paymentStatusLabel } from './sales-labels'

export type ReportScope =
  { kind: 'event'; eventTitle: string } | { kind: 'filtered'; description: string }

export type ReportModel = {
  title: string
  subtitle: string
  generatedAt: string
  exportedBy: string
  fileName: string
  columns: string[]
  rows: string[][]
  totals: Array<[string, string]>
}

const COLUMNS = ['Fecha', 'Cliente', 'Evento', 'Entradas', 'Importe', 'Método', 'Pago', 'Reserva']

/** Everything the sales PDF prints, already formatted; `null` when there is nothing to report. */
export function reportModel(
  rows: SalesRow[],
  scope: ReportScope,
  adminName: string,
  now: Date,
): ReportModel | null {
  if (rows.length === 0) return null
  const scopeTitle = scope.kind === 'event' ? scope.eventTitle : scope.description
  const totals = salesTotals(rows)
  return {
    title: `Informe de ventas · ${scopeTitle}`,
    subtitle: rows.length === 1 ? '1 pago' : `${rows.length} pagos`,
    generatedAt: `Generado el ${formatLongDateTime(now)}`,
    exportedBy: `Exportado por ${adminName}`,
    fileName: `booqi-informe-${slugify(scopeTitle)}-${toLocalDay(now)}.pdf`,
    columns: COLUMNS,
    rows: rows.map((row) => [
      formatNumericDate(row.date),
      row.customer,
      row.eventTitle,
      String(row.tickets),
      formatEuro(row.amountCents),
      paymentMethodLabel(row.method),
      paymentStatusLabel(row.paymentStatus),
      row.bookingStatus ? bookingStatusLabel(row.bookingStatus) : '—',
    ]),
    totals: [
      ['Aprobado', formatEuro(totals.approvedCents)],
      ['Rechazado', formatEuro(totals.rejectedCents)],
      ['Pendiente', formatEuro(totals.pendingCents)],
    ],
  }
}
