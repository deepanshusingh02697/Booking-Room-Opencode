import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ListRow } from './ListRow';
import { StatusBadge } from './StatusBadge';
import { bookingStatusMeta } from '../../theme';
import type { Booking } from '../../types';
import { formatDateTime, formatTime, formatTimeRange } from '../../utils/date';

type BookingRowProps = {
  booking: Booking;
  /**
   * Add the calendar date to the second line. The dashboard panels keep the
   * time-only line they were measured with, so they leave this off.
   */
  showDate?: boolean;
  /** Extra context for the second line, e.g. "Organiser" or "Invited". */
  note?: string;
  action?: ReactNode;
};

/**
 * One booking in an in-card list, linking to its details page. Improvised for
 * Phase 17 on the §7.1/§7.2 primitives (doc/project-state.md §7.2.11 does not
 * cover list rows) and shared by My Bookings, My Meetings and the two employee
 * dashboard panels, so every booking row in the app looks and behaves the same.
 *
 * The whole row is the link's hit area (`after:inset-0` over a `relative` row).
 * The action slot is therefore not independently clickable — keep it a
 * non-interactive badge, as it is today.
 */
export const BookingRow = ({
  booking,
  showDate = false,
  note,
  action,
}: BookingRowProps) => {
  const when = showDate
    ? `${formatDateTime(booking.startTime)} – ${formatTime(booking.endTime)}`
    : formatTimeRange(booking.startTime, booking.endTime);

  return (
    <ListRow
      className="relative"
      action={action ?? <StatusBadge meta={bookingStatusMeta[booking.status]} />}
    >
      <Link
        to={`/bookings/${booking.id}`}
        className="block rounded after:absolute after:inset-0 focus:outline-none focus:ring-2 focus:ring-navy"
      >
        <p className="truncate text-[15px] text-body">{booking.title}</p>
        <p className="mt-1 text-sm text-muted">
          {when}
          {booking.room ? ` · ${booking.room.name}` : ''}
          {note ? ` · ${note}` : ''}
        </p>
      </Link>
    </ListRow>
  );
};
