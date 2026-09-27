import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { BookingRow } from '../../components/common/BookingRow';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { PanelCard } from '../../components/common/PanelCard';
import {
  MY_MEETINGS_QUERY,
  type MyMeetingsData,
} from '../../graphql/queries/bookings';
import { useAuth } from '../../hooks/useAuth';
import { bookingRowNote, buildRecurrenceNotes } from '../../utils/recurrence';

export const MyMeetingsPage = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } =
    useQuery<MyMeetingsData>(MY_MEETINGS_QUERY);

  const meetings = data?.myMeetings ?? [];
  // Only confirmed meetings are listed, so a daily series long enough to hit the
  // 90-occurrence cap is truncated here — the frequency note is read off the
  // occurrences in this list, not from the whole series.
  const recurrenceNotes = useMemo(
    () => buildRecurrenceNotes(meetings),
    [meetings],
  );

  return (
    <div>
      <PageHeader
        title="My Meetings"
        sub="Meetings you organise or have been invited to"
        topPad="pt-10"
      />

      <PanelCard
        title="Upcoming Meetings"
        sub="Confirmed meetings you are part of, soonest first"
      >
        {error ? (
          <ErrorState
            message="Could not load your meetings."
            onRetry={() => void refetch()}
          />
        ) : loading ? (
          <LoadingState />
        ) : meetings.length === 0 ? (
          <EmptyState message="No upcoming meetings." />
        ) : (
          <div className="flex flex-col">
            {meetings.map((meeting) => (
              <BookingRow
                key={meeting.id}
                booking={meeting}
                showDate
                note={bookingRowNote(
                  meeting,
                  recurrenceNotes,
                  meeting.organizerId === user?.id ? 'Organiser' : 'Invited',
                )}
              />
            ))}
          </div>
        )}
      </PanelCard>

      <p className="mt-6 text-sm text-muted">
        Meetings where you are the organiser are also listed in{' '}
        <Link to="/bookings" className="text-navy underline">
          My Bookings
        </Link>
        .
      </p>
    </div>
  );
};
