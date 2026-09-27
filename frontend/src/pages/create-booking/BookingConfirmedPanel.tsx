import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { DetailRow } from '../../components/common/DetailRow';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  RECURRING_BOOKING_GROUP_QUERY,
  type RecurringBookingGroupData,
  type RecurringBookingGroupVars,
} from '../../graphql/queries/bookings';
import { bookingStatusMeta, typeScale } from '../../theme';
import type { Booking } from '../../types';
import { formatDateTime, formatTime } from '../../utils/date';

const SERIES_PREVIEW_LIMIT = 5;

/**
 * What the user gets after a successful booking (user decision, §9.5: stay on
 * the page). For a one-off it is the booking itself. For a series the mutation
 * returns only the FIRST occurrence, so the panel asks the server for the whole
 * group and reports what was really created — the same authoritative list the
 * Booking Details series panel shows, rather than a count the client guessed.
 */
export const BookingConfirmedPanel = ({
  booking,
  onReset,
}: {
  booking: Booking;
  onReset: () => void;
}) => {
  const navigate = useNavigate();
  const recurrenceId = booking.recurrenceId;

  const { data, loading, error } = useQuery<
    RecurringBookingGroupData,
    RecurringBookingGroupVars
  >(RECURRING_BOOKING_GROUP_QUERY, {
    variables: { recurrenceId: recurrenceId ?? '' },
    skip: !recurrenceId,
  });

  const occurrences = data?.recurringBookingGroup ?? [];
  const isSeries = Boolean(recurrenceId);

  return (
    <div>
      <PageHeader
        title="Booking Confirmed"
        sub={
          isSeries
            ? `${booking.title} is booked as a recurring series.`
            : `${booking.title} is booked and on the calendar.`
        }
        topPad="pt-10"
      />
      <AppCard>
        <div className="flex items-center justify-between gap-4">
          <h2 className={typeScale.panelTitle}>{booking.title}</h2>
          <StatusBadge meta={bookingStatusMeta[booking.status]} />
        </div>
        <dl className="mt-4 flex flex-col">
          <DetailRow
            label="Room"
            value={booking.room?.name ?? `Room #${booking.roomId}`}
          />
          <DetailRow
            label="When"
            value={`${formatDateTime(booking.startTime)} – ${formatTime(
              booking.endTime,
            )}`}
          />
          <DetailRow
            label="Organiser"
            value={
              booking.organizer
                ? `${booking.organizer.firstName} ${booking.organizer.lastName}`
                : 'You'
            }
          />
          <DetailRow
            label="Participants"
            value={
              booking.participants && booking.participants.length > 0
                ? booking.participants
                    .map((p) =>
                      p.employee
                        ? `${p.employee.firstName} ${p.employee.lastName}`
                        : `Employee #${p.employeeId}`,
                    )
                    .join(', ')
                : 'Just you'
            }
          />
        </dl>
        {booking.description && (
          <p className="mt-4 text-sm text-muted">{booking.description}</p>
        )}

        {isSeries && (
          <div className="mt-6 border-t border-rule pt-6">
            <h3 className={typeScale.panelTitle}>Series created</h3>
            {loading ? (
              <p className="mt-2 text-sm text-muted">Loading the full series…</p>
            ) : error || occurrences.length === 0 ? (
              <p role="alert" className="mt-2 text-sm text-red-600">
                The series was created, but its full list could not be loaded.
                Open the first booking to see it.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-body">
                  <span className="font-semibold">
                    {occurrences.length} booking
                    {occurrences.length === 1 ? '' : 's'}
                  </span>{' '}
                  were created, from {formatDateTime(occurrences[0].startTime)} to{' '}
                  {formatDateTime(
                    occurrences[occurrences.length - 1].startTime,
                  )}
                  .
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-xs text-muted">
                  {occurrences.slice(0, SERIES_PREVIEW_LIMIT).map((occurrence) => (
                    <li key={occurrence.id}>
                      {formatDateTime(occurrence.startTime)}
                    </li>
                  ))}
                  {occurrences.length > SERIES_PREVIEW_LIMIT && (
                    <li>
                      and {occurrences.length - SERIES_PREVIEW_LIMIT} more
                    </li>
                  )}
                </ul>
              </>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                Open the first booking
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-rule pt-6">
          <Button variant="primary" onClick={onReset}>
            Book another room
          </Button>
          <Button variant="outline" onClick={() => navigate('/bookings')}>
            View My Bookings
          </Button>
        </div>
      </AppCard>
    </div>
  );
};
