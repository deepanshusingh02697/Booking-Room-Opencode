import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ListRow } from '../../components/common/ListRow';
import type { WaitlistEntry } from '../../types';
import { formatDateTime, formatTime, formatTimeRange } from '../../utils/date';

type WaitlistRowProps = {
  entry: WaitlistEntry;
  /** Add the calendar date, as the My Bookings panels do. */
  showDate?: boolean;
  /** Replace the default "Joined …" tail, e.g. with "In progress". */
  note?: string;
  showJoined?: boolean;
  action?: ReactNode;
};

/**
 * One wait-list entry in an in-card list, shared by the Wait-List page and the
 * Room Details panel so an entry looks the same in both.
 *
 * Unlike `BookingRow` the room name alone is the link, not the whole row: this
 * row can carry a real Leave control, and a stretched link overlay would make
 * that control unclickable (doc/project-state.md §8.30).
 */
export const WaitlistRow = ({
  entry,
  showDate = false,
  note,
  showJoined = true,
  action,
}: WaitlistRowProps) => {
  const when = showDate
    ? `${formatDateTime(entry.startTime)} – ${formatTime(entry.endTime)}`
    : formatTimeRange(entry.startTime, entry.endTime);
  const roomName = entry.room?.name ?? `Room #${entry.roomId}`;

  return (
    <ListRow action={action}>
      <Link
        to={`/rooms/${entry.roomId}`}
        className="block rounded focus:outline-none focus:ring-2 focus:ring-navy"
      >
        <p className="truncate text-[15px] text-body">{roomName}</p>
        <p className="mt-1 text-sm text-muted">
          {when}
          {showJoined ? ` · Joined ${formatDateTime(entry.createdAt)}` : ''}
          {note ? ` · ${note}` : ''}
        </p>
      </Link>
    </ListRow>
  );
};
