import { CalendarHeart } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { PageMeta } from '../../../app/PageMeta'
import { PageHeader } from '../../../components/PageHeader'
import { QueryState } from '../../../components/QueryState'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/use-toast'
import { toApiError } from '../../../lib/api-error'
import { userMessage } from '../../../lib/error-messages'
import { listStagger } from '../../../lib/motion'
import type { BookingResponse } from '../../../types/booking'
import { useSessionStore } from '../../auth/hooks/session-store'
import { BookingDetailDrawer } from '../components/BookingDetailDrawer'
import { BookingGroupCard } from '../components/BookingGroupCard'
import { CancelBookingDialog } from '../components/CancelBookingDialog'
import { groupBookingsByEvent } from '../hooks/group-bookings'
import { useCancelBooking, useMyBookings } from '../hooks/use-my-bookings'

function BookingsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1].map((index) => (
        <div key={index} className="flex gap-4 rounded-xl border border-border bg-surface p-6">
          <Skeleton className="size-16 rounded-lg" />
          <div className="flex flex-1 flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function BookingsList({ userId }: { userId: number }) {
  const bookings = useMyBookings(userId)
  const cancel = useCancelBooking()
  const toast = useToast()
  const reduced = useReducedMotion() ?? false
  const { container, item } = listStagger(reduced)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [cancelId, setCancelId] = useState<number | null>(null)
  const find = (id: number | null) => bookings.data?.find((booking) => booking.id === id) ?? null

  function askToCancel(booking: BookingResponse) {
    setDetailId(null)
    setCancelId(booking.id)
  }

  function confirmCancel(booking: BookingResponse) {
    cancel.mutate(booking.id, {
      onSuccess: () =>
        toast.show({
          tone: 'success',
          title: 'Reserva cancelada',
          description: `Reserva ${booking.id} · ${booking.eventTitle}`,
        }),
      onError: (error) => toast.show({ tone: 'danger', title: userMessage(toApiError(error)) }),
      onSettled: () => setCancelId(null),
    })
  }

  return (
    <>
      <QueryState
        query={bookings}
        label="Cargando reservas"
        skeleton={<BookingsSkeleton />}
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={CalendarHeart}
            title="Todavía no tienes reservas"
            description="Cuando compres entradas aparecerán aquí, listas para descargar."
            action={<ButtonLink to="/events">Explorar eventos</ButtonLink>}
          />
        }
      >
        {(data) => (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            {groupBookingsByEvent(data).map((group) => (
              <motion.div key={group.eventId} variants={item}>
                <BookingGroupCard
                  group={group}
                  onDetail={(booking) => setDetailId(booking.id)}
                  onCancel={askToCancel}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </QueryState>
      <BookingDetailDrawer
        booking={find(detailId)}
        onClose={() => setDetailId(null)}
        onCancel={askToCancel}
      />
      <CancelBookingDialog
        booking={find(cancelId)}
        cancelling={cancel.isPending}
        onConfirm={confirmCancel}
        onClose={() => setCancelId(null)}
      />
    </>
  )
}

export function MyBookingsPage() {
  const user = useSessionStore((state) => state.user)
  return (
    <div className="flex flex-col gap-8">
      <PageMeta title="Mis reservas" description="Consulta tus reservas y descarga tus entradas." />
      <PageHeader
        eyebrow="Tu cuenta"
        title="Mis reservas"
        description="Tus entradas agrupadas por evento. Descárgalas o cancela una reserva cuando lo necesites."
      />
      {user && <BookingsList userId={user.id} />}
    </div>
  )
}
