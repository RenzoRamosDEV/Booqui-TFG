import { PageMeta } from '../../../app/PageMeta'
import { PageHeader } from '../../../components/PageHeader'
import { QueryState } from '../../../components/QueryState'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Tabs } from '../../../components/ui/Tabs'
import type { EventResponse } from '../../../types/event'
import { useSessionStore } from '../../auth/hooks/session-store'
import { useEvents } from '../../events/hooks/use-events'
import { EventsTab } from '../components/EventsTab'
import { ReportPreviewDialog } from '../components/ReportPreviewDialog'
import { SalesTab } from '../components/SalesTab'
import { SummaryCards } from '../components/SummaryCards'
import { UsersTab } from '../components/UsersTab'
import { useReportExport } from '../components/use-report-export'
import { adminSummary } from '../hooks/admin-summary'
import { buildSalesRows, filterSalesRows } from '../hooks/sales'
import { useAllBookings, usePayments, useUsers } from '../hooks/use-admin-queries'

function SummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
  )
}

export function AdminPage() {
  const user = useSessionStore((state) => state.user)
  const users = useUsers()
  const events = useEvents()
  const payments = usePayments()
  const bookings = useAllBookings()
  const report = useReportExport(user ? `${user.firstName} ${user.lastName}` : 'Administración')

  const sales = {
    data: payments.data && bookings.data ? buildSalesRows(payments.data, bookings.data) : undefined,
    error: payments.error ?? bookings.error,
    isPending: payments.isPending || bookings.isPending,
    refetch: () => Promise.all([payments.refetch(), bookings.refetch()]),
  }
  const summary = {
    data:
      users.data && events.data && sales.data
        ? adminSummary(users.data, events.data, sales.data)
        : undefined,
    error: users.error ?? events.error ?? sales.error,
    isPending: users.isPending || events.isPending || sales.isPending,
    refetch: () => Promise.all([users.refetch(), events.refetch(), sales.refetch()]),
  }

  function eventReport(event: EventResponse) {
    const rows = filterSalesRows(sales.data ?? [], { status: 'ALL', eventId: event.id })
    void report.showPreview(rows, { kind: 'event', eventTitle: event.title })
  }

  return (
    <div className="flex flex-col gap-8">
      <PageMeta
        title="Administración"
        description="Gestiona usuarios, eventos y ventas de Booqi."
      />
      <PageHeader
        eyebrow="Administración"
        title="Panel de administración"
        description="Usuarios, eventos y ventas de Booqi en un solo sitio."
      />
      <QueryState query={summary} label="Cargando resumen" skeleton={<SummarySkeleton />}>
        {(data) => <SummaryCards summary={data} />}
      </QueryState>
      <Tabs
        label="Secciones de administración"
        items={[
          { id: 'users', label: 'Usuarios', content: user && <UsersTab currentUserId={user.id} /> },
          { id: 'events', label: 'Eventos', content: <EventsTab onReport={eventReport} /> },
          {
            id: 'sales',
            label: 'Ventas',
            content: (
              <QueryState
                query={sales}
                label="Cargando ventas"
                skeleton={<Skeleton className="h-64 w-full" />}
              >
                {(rows) => (
                  <SalesTab
                    rows={rows}
                    busy={report.busy}
                    onPreview={report.showPreview}
                    onDownload={report.download}
                  />
                )}
              </QueryState>
            ),
          },
        ]}
      />
      <ReportPreviewDialog preview={report.preview} onClose={report.closePreview} />
    </div>
  )
}
