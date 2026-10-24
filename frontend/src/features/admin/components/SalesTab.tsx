import { Download, Eye } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { formatNumericDate } from '../../../lib/dates'
import { formatEuro } from '../../../lib/money'
import type { PaymentStatus } from '../../../types/payment'
import { bookingStatusLabel, bookingStatusTone } from '../../bookings/hooks/group-bookings'
import type { ReportScope } from '../hooks/report-model'
import { filterSalesRows, salesTotals, type SalesFilter, type SalesRow } from '../hooks/sales'
import { paymentMethodLabel, paymentStatusLabel, paymentStatusTone } from '../hooks/sales-labels'
import { cellClass, headCellClass, tableClass, tableFrameClass } from './table-styles'

const statusOptions: Array<{ value: SalesFilter['status']; label: string; description: string }> = [
  { value: 'ALL', label: 'Todos', description: 'Todos los pagos' },
  { value: 'APPROVED', label: 'Aprobados', description: 'Pagos aprobados' },
  { value: 'REJECTED', label: 'Rechazados', description: 'Pagos rechazados' },
  { value: 'PENDING', label: 'Pendientes', description: 'Pagos pendientes' },
]

function eventsOf(rows: SalesRow[]) {
  return [...new Map(rows.map((row) => [row.eventId, row.eventTitle])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1]),
  )
}

function Total({
  id,
  label,
  cents,
  tone,
}: {
  id: string
  label: string
  cents: number
  tone: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className={`text-xs font-semibold tracking-wide uppercase ${tone}`}>{label}</p>
      <p data-testid={`total-${id}`} className="mt-1 font-display text-xl font-bold text-fg">
        {formatEuro(cents)}
      </p>
    </div>
  )
}

export type SalesTabProps = {
  rows: SalesRow[]
  busy: boolean
  onPreview: (rows: SalesRow[], scope: ReportScope) => void
  onDownload: (rows: SalesRow[], scope: ReportScope) => void
}

export function SalesTab({ rows, busy, onPreview, onDownload }: SalesTabProps) {
  const [filter, setFilter] = useState<SalesFilter>({ status: 'ALL', eventId: null })
  const visible = filterSalesRows(rows, filter)
  const totals = salesTotals(visible)
  const events = eventsOf(rows)
  const eventTitle = events.find(([id]) => id === filter.eventId)?.[1]
  const scope: ReportScope = eventTitle
    ? { kind: 'event', eventTitle }
    : {
        kind: 'filtered',
        description: statusOptions.find((option) => option.value === filter.status)!.description,
      }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <Select
          label="Estado del pago"
          value={filter.status}
          onChange={(event) =>
            setFilter({ ...filter, status: event.target.value as PaymentStatus | 'ALL' })
          }
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          label="Evento"
          value={filter.eventId ?? ''}
          onChange={(event) =>
            setFilter({
              ...filter,
              eventId: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">Todos los eventos</option>
          {events.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
          <Button variant="secondary" loading={busy} onClick={() => onPreview(visible, scope)}>
            <Eye aria-hidden="true" className="size-4" />
            Vista previa del informe
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onDownload(visible, scope)}
            aria-label="Descargar informe"
          >
            <Download aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Total id="approved" label="Aprobado" cents={totals.approvedCents} tone="text-success" />
        <Total id="rejected" label="Rechazado" cents={totals.rejectedCents} tone="text-danger" />
        <Total id="pending" label="Pendiente" cents={totals.pendingCents} tone="text-warning" />
      </div>
      <div className={tableFrameClass}>
        <table aria-label="Ventas" className={`${tableClass} min-w-[56rem]`}>
          <thead>
            <tr>
              {[
                'Fecha',
                'Cliente',
                'Evento',
                'Entradas',
                'Importe',
                'Método',
                'Pago',
                'Reserva',
              ].map((column) => (
                <th key={column} className={headCellClass}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className={`${cellClass} py-10 text-center text-fg-muted`}>
                  No hay ventas con estos filtros.
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr
                key={row.paymentId}
                className="transition-colors hover:bg-brand-50/50 dark:hover:bg-white/[0.03]"
              >
                <td className={`${cellClass} whitespace-nowrap`}>{formatNumericDate(row.date)}</td>
                <td className={cellClass}>
                  <span className="flex flex-col">
                    <span className="font-medium">{row.customer}</span>
                    {row.customerEmail && (
                      <span className="text-xs text-fg-muted">{row.customerEmail}</span>
                    )}
                  </span>
                </td>
                <td className={cellClass}>{row.eventTitle}</td>
                <td className={cellClass}>{row.tickets}</td>
                <td className={`${cellClass} font-semibold whitespace-nowrap`}>
                  {formatEuro(row.amountCents)}
                </td>
                <td className={cellClass}>{paymentMethodLabel(row.method)}</td>
                <td className={cellClass}>
                  <Badge tone={paymentStatusTone(row.paymentStatus)}>
                    {paymentStatusLabel(row.paymentStatus)}
                  </Badge>
                </td>
                <td className={cellClass}>
                  {row.bookingStatus ? (
                    <Badge tone={bookingStatusTone(row.bookingStatus)}>
                      {bookingStatusLabel(row.bookingStatus)}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
