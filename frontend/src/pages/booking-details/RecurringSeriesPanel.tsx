import { useState } from 'react';
import { BookingRow } from '../../components/common/BookingRow';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { ListRow } from '../../components/common/ListRow';
import { LoadingState } from '../../components/common/LoadingState';
import { PanelCard } from '../../components/common/PanelCard';
import type { Booking } from '../../types';

const SERIES_LIMIT = 10;

type RecurringSeriesPanelProps = {
  occurrences: Booking[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
};

/**
 * Every occurrence of a recurring series, in the series' own order (start
 * ascending). Improvised for Phase 18 on the §7.1/§7.2 primitives, authorised as
 * not pixel-referenced in §9.7.
 *
 * Each occurrence is a `BookingRow`, so it links to its own details page — where
 * it can be cancelled on its own. There is deliberately **no** whole-series
 * action: the backend has no `cancelSeries` mutation, and the copy says so
 * rather than implying one exists.
 */
export const RecurringSeriesPanel = ({
  occurrences,
  loading,
  error,
  onRetry,
}: RecurringSeriesPanelProps) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? occurrences : occurrences.slice(0, SERIES_LIMIT);

  // Never state a count the query has not returned: an errored query has no
  // data, and "All 0 bookings" would be a lie rather than an absence.
  const sub = error
    ? 'The rest of this series could not be loaded'
    : loading
      ? 'Loading every occurrence of this series'
      : `All ${occurrences.length} booking${
          occurrences.length === 1 ? '' : 's'
        } in this series, soonest first`;

  return (
    <div className="mt-5">
      <PanelCard
        title="Recurring series"
        sub={sub}
        action={
          !loading && !error && occurrences.length > SERIES_LIMIT ? (
            <Button
              variant="outline"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? 'Show less' : `Show all ${occurrences.length}`}
            </Button>
          ) : undefined
        }
      >
        {error ? (
          <ErrorState
            message="Could not load the rest of this series."
            onRetry={onRetry}
          />
        ) : loading ? (
          <LoadingState />
        ) : occurrences.length === 0 ? (
          <EmptyState message="This series has no other occurrences." />
        ) : (
          <div className="flex flex-col">
            {visible.map((occurrence) => (
              <BookingRow
                key={occurrence.id}
                booking={occurrence}
                showDate
              />
            ))}
            {!showAll && occurrences.length > SERIES_LIMIT && (
              <ListRow>
                <p className="text-sm text-muted">
                  Showing the first {SERIES_LIMIT} of {occurrences.length}{' '}
                  bookings in this series.
                </p>
              </ListRow>
            )}
            <ListRow>
              <p className="text-xs text-muted">
                Occurrences are cancelled one at a time — cancelling one leaves
                the rest of the series booked.
              </p>
            </ListRow>
          </div>
        )}
      </PanelCard>
    </div>
  );
};
