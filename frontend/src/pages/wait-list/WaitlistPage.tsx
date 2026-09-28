import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LuPlus, LuRefreshCw } from 'react-icons/lu';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { PanelCard } from '../../components/common/PanelCard';
import {
  MY_WAITLIST_QUERY,
  type MyWaitlistData,
} from '../../graphql/queries/waitlist';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { copy, layout } from '../../theme';
import type { WaitlistEntry } from '../../types';
import { isInProgress } from '../../utils/date';
import {
  bookSlotHref,
  isActiveWaitlistEntry,
  sortWaitlistByWindow,
} from '../../utils/waitlist';
import { LeaveWaitlistModal } from './LeaveWaitlistModal';
import { WaitlistRow } from './WaitlistRow';

const PASSED_LIMIT = 10;

/**
 * `/wait-list` — every entry the signed-in user holds, split by whether its
 * window has finished (FR-34/35/36). Mirrors My Bookings: same two panels, same
 * one-clock-per-render split, same capped past list.
 */
export const WaitlistPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery<MyWaitlistData>(
    MY_WAITLIST_QUERY,
  );
  const [leaving, setLeaving] = useState<WaitlistEntry | null>(null);
  const [leftRoom, setLeftRoom] = useState<string | null>(null);
  const [showAllPassed, setShowAllPassed] = useState(false);

  // An entry is converted into a real booking by a cancellation somewhere else,
  // which emits no client event until the Phase 23 socket lands. Refetching on
  // focus is the cheap half of picking that up; Refresh is the explicit one.
  useRefetchOnFocus(() => {
    void refetch();
  });

  const entries = data?.myWaitlist ?? [];
  // One reading of the clock per render, so both panels split on the same "now".
  const now = new Date();

  // An entry stays waiting until its window *ends*, so a slot that is running
  // right now is still listed here, at the top, marked "In progress".
  const waiting = sortWaitlistByWindow(
    entries.filter((entry) => isActiveWaitlistEntry(entry, now)),
    'asc',
  );
  const passed = sortWaitlistByWindow(
    entries.filter((entry) => !isActiveWaitlistEntry(entry, now)),
    'desc',
  );

  const visiblePassed = showAllPassed ? passed : passed.slice(0, PASSED_LIMIT);

  return (
    <div>
      <PageHeader
        title="Wait-List"
        sub="Rooms you are waiting for, and the slots you have waited for"
        topPad="pt-10"
        action={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              icon={<LuRefreshCw aria-hidden />}
              loading={loading}
              onClick={() => void refetch()}
            >
              Refresh
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

      {leftRoom && (
        <p role="status" className="mb-4 text-sm font-medium text-navy">
          Left the wait-list for {leftRoom}.
        </p>
      )}

      {error ? (
        <ErrorState
          message="Could not load your wait-list."
          onRetry={() => void refetch()}
        />
      ) : (
        <div className={layout.panelRow}>
          <PanelCard
            title="Waiting"
            sub="Your entries that have not finished yet, soonest first"
          >
            {loading ? (
              <LoadingState />
            ) : waiting.length === 0 ? (
              <EmptyState message="You are not on any wait-list. Join one from Create Booking when the slot you want is already taken." />
            ) : (
              <div className="flex flex-col">
                {waiting.map((entry) => (
                  <WaitlistRow
                    key={entry.id}
                    entry={entry}
                    showDate
                    note={
                      isInProgress(entry.startTime, entry.endTime, now)
                        ? 'In progress'
                        : undefined
                    }
                    action={
                      <>
                        <Link
                          to={bookSlotHref(entry)}
                          className="text-sm text-navy underline hover:text-brand"
                        >
                          Book this slot
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setLeftRoom(null);
                            setLeaving(entry);
                          }}
                        >
                          Leave wait-list
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard
            title="Passed"
            sub="Your earlier entries, most recent first"
            action={
              passed.length > PASSED_LIMIT ? (
                <Button
                  variant="outline"
                  onClick={() => setShowAllPassed((value) => !value)}
                >
                  {showAllPassed ? 'Show less' : `Show all ${passed.length}`}
                </Button>
              ) : undefined
            }
          >
            {loading ? (
              <LoadingState />
            ) : passed.length === 0 ? (
              <EmptyState message="No wait-list entries have passed." />
            ) : (
              <div className="flex flex-col">
                {visiblePassed.map((entry) => (
                  <WaitlistRow
                    key={entry.id}
                    entry={entry}
                    showDate
                    showJoined={false}
                  />
                ))}
                {!showAllPassed && passed.length > PASSED_LIMIT && (
                  <ListRow>
                    <p className="text-sm text-muted">
                      Showing the {PASSED_LIMIT} most recent of {passed.length}{' '}
                      passed entries.
                    </p>
                  </ListRow>
                )}
              </div>
            )}
          </PanelCard>
        </div>
      )}

      <LeaveWaitlistModal
        open={leaving !== null}
        entry={leaving}
        onClose={() => setLeaving(null)}
        onLeft={(entry) =>
          setLeftRoom(entry.room?.name ?? `Room #${entry.roomId}`)
        }
      />
    </div>
  );
};
