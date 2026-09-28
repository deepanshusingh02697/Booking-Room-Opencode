import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PanelCard } from '../../components/common/PanelCard';
import {
  MY_WAITLIST_QUERY,
  type MyWaitlistData,
} from '../../graphql/queries/waitlist';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import type { WaitlistEntry } from '../../types';
import { formatDateTime } from '../../utils/date';
import {
  isActiveWaitlistEntry,
  sortWaitlistByWindow,
} from '../../utils/waitlist';
import { LeaveWaitlistModal } from './LeaveWaitlistModal';
import { WaitlistRow } from './WaitlistRow';

type RoomWaitlistPanelProps = {
  roomId: number;
  className?: string;
};

/**
 * The signed-in user's own wait-list entries for one room, on the room's page.
 *
 * Only *this* room's entries and only the still-waiting ones: the panel answers
 * "am I queued for this room, and can I get out of it", which is what someone
 * looking at the room needs. The full waiting/passed history — including other
 * rooms — is the Wait-List page's job, and the count on My Bookings links there.
 *
 * Joining is not offered here (the agreed flow puts it on Create Booking, which
 * knows the exact window the user wants), but leaving is, because this is where
 * someone standing in front of the room looks for it.
 */
export const RoomWaitlistPanel = ({ roomId, className = '' }: RoomWaitlistPanelProps) => {
  const { data, loading, error, refetch } = useQuery<MyWaitlistData>(
    MY_WAITLIST_QUERY,
  );
  const [leaving, setLeaving] = useState<WaitlistEntry | null>(null);
  const [leftAt, setLeftAt] = useState<string | null>(null);

  useRefetchOnFocus(() => {
    void refetch();
  });

  const now = new Date();
  const waiting = sortWaitlistByWindow(
    (data?.myWaitlist ?? []).filter(
      (entry) => entry.roomId === roomId && isActiveWaitlistEntry(entry, now),
    ),
    'asc',
  );

  return (
    <PanelCard
      title="Wait-List"
      sub="Slots you are waiting for in this room"
      className={className}
    >
      {/* Kept outside the rows/empty branch, like WaitlistPage: leaving the last
          entry for a room empties the panel, and the confirmation has to survive
          that — otherwise the user gets no feedback at all. */}
      {leftAt && !error && (
        <p role="status" className="mb-2 text-sm font-medium text-navy">
          Left the wait-list for {leftAt}.
        </p>
      )}

      {error ? (
        <ErrorState
          message="Could not load your wait-list entries."
          onRetry={() => void refetch()}
        />
      ) : loading ? (
        <LoadingState />
      ) : waiting.length === 0 ? (
        <EmptyState message="You are not on the wait-list for this room." />
      ) : (
        <>
          <div className="flex flex-col">
            {waiting.map((entry) => (
              <WaitlistRow
                key={entry.id}
                entry={entry}
                showDate
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLeftAt(null);
                      setLeaving(entry);
                    }}
                  >
                    Leave wait-list
                  </Button>
                }
              />
            ))}
          </div>
        </>
      )}

      <LeaveWaitlistModal
        open={leaving !== null}
        entry={leaving}
        onClose={() => setLeaving(null)}
        onLeft={(entry) => setLeftAt(formatDateTime(entry.startTime))}
      />
    </PanelCard>
  );
};
