import { Badge } from '../../../components/ui/Badge'
import type { BookingStatus } from '../../../types/booking'
import { bookingStatusLabel, bookingStatusTone } from '../hooks/group-bookings'

export function BookingStatusBadge({ status, testId }: { status: BookingStatus; testId?: string }) {
  return (
    <Badge tone={bookingStatusTone(status)} data-testid={testId}>
      {bookingStatusLabel(status)}
    </Badge>
  )
}
