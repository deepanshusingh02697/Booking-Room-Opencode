import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LuCalendar, LuRefreshCw } from 'react-icons/lu';
import { AppCard } from '../../components/common/AppCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { PanelCard } from '../../components/common/PanelCard';
import { StatCard } from '../../components/common/StatCard';
import { RangePicker } from '../../components/forms/RangePicker';
import {
  USAGE_ANALYTICS_QUERY,
  type UsageAnalyticsData,
  type UsageAnalyticsVars,
} from '../../graphql/queries/analytics';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { layout } from '../../theme';
import { summariseUsage } from '../../utils/analytics';
import {
  defaultLocalDateRange,
  localDateRangeToGraphQL,
  type LocalDateRange,
} from '../../utils/date';
import { RoomUsageTable } from './RoomUsageTable';

/**
 * Room usage for a chosen range: four office-wide tiles above the per-room
 * table.
 *
 * `usageAnalytics` returns **one row per room, every room, idle rooms as
 * 0/0/0** (a Phase 12 decision), so the tiles are sums over the complete row
 * set rather than a second query, and the table below always lists every room
 * in the office — an idle room reads as unused instead of missing.
 *
 * A range change keeps the last answer on screen and marks the region
 * `aria-busy` while the new one is fetched; blanking the tiles to zero for the
 * few hundred milliseconds in between would look like a real result.
 */
export const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<LocalDateRange>(() =>
    defaultLocalDateRange(new Date()),
  );

  // The server refuses an inverted range, so ask no query and say why.
  const rangeValid = range.from <= range.to;
  const input = useMemo(
    () => (rangeValid ? localDateRangeToGraphQL(range) : undefined),
    [range, rangeValid],
  );

  const { data, loading, error, refetch } = useQuery<
    UsageAnalyticsData,
    UsageAnalyticsVars
  >(USAGE_ANALYTICS_QUERY, {
    variables: input ? { input } : undefined,
    skip: !input,
  });

  /**
   * The one way this page re-reads the range.
   *
   * The `rangeValid` guard is load-bearing, not defensive: `skip: true` only
   * parks the query in Apollo's `standby` fetch policy, and `refetch()` overrides
   * that to `network-only`. With `variables` undefined Apollo sends `{}`, so
   * refetching an inverted range put a malformed request on the wire that the
   * server refused with `BAD_USER_INPUT`. Nothing on screen showed it — the
   * `!rangeValid` branch renders above these — so it failed silently once per
   * focus and once per Refresh.
   */
  const refetchRange = () => {
    if (!rangeValid) return;
    void refetch();
  };

  useRefetchOnFocus(refetchRange);

  const rows = data?.usageAnalytics ?? [];
  const summary = useMemo(() => summariseUsage(rows), [rows]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        sub="How each room was used over the selected range"
        action={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="outline"
              icon={<LuRefreshCw aria-hidden />}
              loading={loading}
              onClick={refetchRange}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              icon={<LuCalendar aria-hidden />}
              onClick={() => navigate('/admin/calendar')}
            >
              View Calendar
            </Button>
          </div>
        }
      />

      <AppCard>
        <RangePicker range={range} onChange={setRange} />
      </AppCard>

      {!rangeValid ? (
        <ErrorState message="Choose a start date that is on or before the end date to see the usage report." />
      ) : error ? (
        <div className="mt-5">
          <ErrorState message="Could not load room usage." onRetry={refetchRange} />
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="mt-5">
          <LoadingState />
        </div>
      ) : (
        <>
          <div className={`${layout.statRow4} mt-5`} aria-busy={loading}>
            <StatCard value={summary.totalBookings} label="Total Bookings" />
            <StatCard value={summary.cancellations} label="Cancellations" />
            <StatCard value={summary.noShows} label="No-shows" />
            <StatCard value={summary.roomsWithUsage} label="Rooms With Usage" />
          </div>

          <div className="mt-5" aria-busy={loading}>
            <PanelCard
              title="Room Usage"
              sub="Every room in the office, including the ones with no bookings in this range"
            >
              {rows.length === 0 ? (
                <EmptyState message="No room usage data available." />
              ) : (
                <RoomUsageTable rows={rows} />
              )}
            </PanelCard>
          </div>

          <p className="mt-4 text-sm text-muted">
            The tiles are the totals of every row in the table, so they always
            reconcile with it. Bookings count all outcomes: a cancellation or a
            no-show is part of a room's total, not a deduction from it.
          </p>
        </>
      )}
    </div>
  );
};
