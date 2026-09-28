import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LuListOrdered, LuPlus, LuRefreshCw } from 'react-icons/lu';
import { BookingRow } from '../../components/common/BookingRow';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { PanelCard } from '../../components/common/PanelCard';
import {
  MY_BOOKINGS_QUERY,
  type MyBookingsData,
} from '../../graphql/queries/bookings';
import {
  MY_WAITLIST_QUERY,
  type MyWaitlistData,
} from '../../graphql/queries/waitlist';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { copy, layout } from '../../theme';
import { BookingStatus, type Booking } from '../../types';
import { isInProgress } from '../../utils/date';
import { bookingRowNote, buildRecurrenceNotes } from '../../utils/recurrence';
import { activeWaitlistEntries } from '../../utils/waitlist';

const PAST_LIMIT = 10;

const byStart = (direction: 'asc' | 'desc') => (a: Booking, b: Booking) =>
  direction === 'asc'
    ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    : new Date(b.startTime).getTime() - new Date(a.startTime).getTime();

export const MyBookingsPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } =
    useQuery<MyBookingsData>(MY_BOOKINGS_QUERY);
  // Kept alongside the bookings so the header can show how many slots the user
  // is queued for, and so the two lists are always read in the same pass.
  const {
    data: waitlistData,
    loading: waitlistLoading,
    refetch: refetchWaitlist,
  } = useQuery<MyWaitlistData>(MY_WAITLIST_QUERY);
  const [showAllPast, setShowAllPast] = useState(false);

  // A CONFIRMED booking is flipped to NO_SHOW or COMPLETED by a node-cron tick
  // that emits no socket event (Phase 13 shipped no NO_SHOW_RELEASED type), so
  // this list's status badges go stale on their own. A wait-list entry converted
  // by a cancellation has the same problem until Phase 23. Refetching when the
  // tab regains focus is the cheap half of staying correct; the Refresh control
  // below is the explicit one.
  useRefetchOnFocus(() => {
    void refetch();
    void refetchWaitlist();
  });

  const bookings = data?.myBookings ?? [];
  // Built from every booking, not just the ones on screen, so a series split
  // across the now-line still shows its cadence on both halves.
  const recurrenceNotes = useMemo(
    () => buildRecurrenceNotes(bookings),
    [bookings],
  );
  // One reading of the clock per render, so both lists split on the same "now".
  const now = new Date();

  // A booking is upcoming until it ends, so a meeting that is running right now
  // is still listed there, at the top, marked "In progress".
  const upcoming = bookings
    .filter((b) => new Date(b.endTime).getTime() > now.getTime())
    .sort(byStart('asc'));
  const past = bookings
    .filter((b) => new Date(b.endTime).getTime() <= now.getTime())
    .sort(byStart('desc'));

  const visiblePast = showAllPast ? past : past.slice(0, PAST_LIMIT);

  // Only slots still ahead of the user count: an entry whose window has passed
  // is history, not something to act on, and would only inflate the badge.
  const waitlistCount = activeWaitlistEntries(
    waitlistData?.myWaitlist ?? [],
    now,
  ).length;

  return (
    <div>
      <PageHeader
        title="My Bookings"
        sub="Every booking you organise, upcoming and past"
        topPad="pt-10"
        action={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              icon={<LuRefreshCw aria-hidden />}
              loading={loading || waitlistLoading}
              onClick={() => {
                void refetch();
                void refetchWaitlist();
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              icon={<LuListOrdered aria-hidden />}
              onClick={() => navigate('/wait-list')}
            >
              {waitlistCount > 0 ? `Wait-List (${waitlistCount})` : 'Wait-List'}
            </Button>
            <Button
              variant="primary"
              icon={<LuPlus aria-hidden />}
              onClick={() => navigate('/create-booking')}
            >
              {copy.dashboardButtons.bookARoom}
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          message="Could not load your bookings."
          onRetry={() => void refetch()}
        />
      ) : (
        <div className={layout.panelRow}>
          <PanelCard
            title="Upcoming"
            sub="Your bookings that have not finished yet, soonest first"
          >
            {loading ? (
              <LoadingState />
            ) : upcoming.length === 0 ? (
              <EmptyState message="No upcoming bookings." />
            ) : (
              <div className="flex flex-col">
                {upcoming.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    showDate
                    note={bookingRowNote(
                      booking,
                      recurrenceNotes,
                      booking.status === BookingStatus.CONFIRMED &&
                        isInProgress(booking.startTime, booking.endTime, now)
                        ? 'In progress'
                        : undefined,
                    )}
                  />
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard
            title="Past"
            sub="Your earlier bookings, most recent first"
            action={
              past.length > PAST_LIMIT ? (
                <Button
                  variant="outline"
                  onClick={() => setShowAllPast((value) => !value)}
                >
                  {showAllPast
                    ? 'Show less'
                    : `Show all ${past.length}`}
                </Button>
              ) : undefined
            }
          >
            {loading ? (
              <LoadingState />
            ) : past.length === 0 ? (
              <EmptyState message="No past bookings." />
            ) : (
              <div className="flex flex-col">
                {visiblePast.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    showDate
                    note={bookingRowNote(booking, recurrenceNotes)}
                  />
                ))}
                {!showAllPast && past.length > PAST_LIMIT && (
                  <ListRow>
                    <p className="text-sm text-muted">
                      Showing the {PAST_LIMIT} most recent of {past.length} past
                      bookings.
                    </p>
                  </ListRow>
                )}
              </div>
            )}
          </PanelCard>
        </div>
      )}
    </div>
  );
};
