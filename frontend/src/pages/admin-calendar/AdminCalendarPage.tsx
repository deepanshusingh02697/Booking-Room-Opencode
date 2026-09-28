import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { LuChartColumn, LuRefreshCw } from 'react-icons/lu';
import { AppCard } from '../../components/common/AppCard';
import { BookingRow } from '../../components/common/BookingRow';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { PanelCard } from '../../components/common/PanelCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RangePicker } from '../../components/forms/RangePicker';
import {
  ADMIN_CALENDAR_QUERY,
  type AdminCalendarData,
  type AdminCalendarVars,
} from '../../graphql/queries/analytics';
import {
  OFFICE_MAINTENANCE_QUERY,
  type OfficeMaintenanceData,
  type OfficeMaintenanceVars,
} from '../../graphql/queries/maintenance';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import { maintenanceWindowMeta } from '../../theme';
import { buildCalendarDays, maintenanceSegmentLabel, type CalendarEntry } from '../../utils/calendar';
import {
  defaultLocalDateRange,
  formatDateTime,
  formatDayHeading,
  isSameLocalDay,
  localDateRangeToGraphQL,
  type LocalDateRange,
} from '../../utils/date';
import { isActiveMaintenance } from '../../utils/maintenance';
import { MaintenanceRow } from '../maintenance/MaintenanceRow';

const DAY_LIMIT = 10;

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/**
 * The admin calendar: every booking in the office for a chosen range, grouped
 * into day agendas, with the maintenance windows overlapping the same range on
 * the same days — so an admin can see not only what is booked but what is
 * blocking a room. A window is listed on every day it covers, not only the day
 * it starts, so a week-long block is visible on each day it blocks.
 *
 * Two reads cover the range rather than one per room: `adminCalendar`
 * (bookings) and `officeMaintenance` (windows) take the same `DateRangeInput`.
 * The range is day-granular and half-open, which is the server's own overlap
 * rule, so a booking starting exactly at midnight after the picked day is
 * excluded.
 */
export const AdminCalendarPage = () => {
  const navigate = useNavigate();
  // One clock read per render: the "In progress" notes and the highlighted
  // preset inside the range control both come from this same reading.
  const now = new Date();
  const [range, setRange] = useState<LocalDateRange>(() =>
    defaultLocalDateRange(new Date()),
  );
  const [showAllDays, setShowAllDays] = useState(false);

  // An inverted range is refused by the server, so the page reports it inline
  // and sends no query rather than sending a range it knows will fail. `skip`
  // alone is not enough to guarantee that — see `refetchRange` below.
  const rangeValid = range.from <= range.to;
  const input = useMemo(
    () => (rangeValid ? localDateRangeToGraphQL(range) : undefined),
    [range, rangeValid],
  );

  const calendar = useQuery<AdminCalendarData, AdminCalendarVars>(
    ADMIN_CALENDAR_QUERY,
    { variables: input ? { input } : undefined, skip: !input },
  );
  const maintenance = useQuery<OfficeMaintenanceData, OfficeMaintenanceVars>(
    OFFICE_MAINTENANCE_QUERY,
    { variables: input ? { input } : undefined, skip: !input },
  );

  /**
   * The one way this page re-reads the range, from any of the three triggers
   * below.
   *
   * The `rangeValid` guard is load-bearing, not defensive: `skip: true` only
   * parks a query in Apollo's `standby` fetch policy, and `refetch()` overrides
   * that to `network-only`. With `variables` undefined Apollo sends `{}`, so
   * refetching an inverted range put a malformed request on the wire that the
   * server refused with `BAD_USER_INPUT`. Nothing on screen showed it — the
   * `!rangeValid` branch renders above these — so it failed silently once per
   * focus and once per Refresh. Not sending the request at all is the only
   * version of this that is true to the comment above.
   */
  const refetchRange = () => {
    if (!rangeValid) return;
    void calendar.refetch();
    void maintenance.refetch();
  };

  // A cron tick can flip a booking to NO_SHOW or COMPLETED while this page is
  // open, and those jobs emit no socket event (Phase 13 shipped no
  // NO_SHOW_RELEASED type on purpose), so the status badges go stale on their
  // own. Refetch on focus is the cheap half; Refresh below is the explicit one.
  useRefetchOnFocus(refetchRange);

  const loading = calendar.loading || maintenance.loading;
  const failed = Boolean(calendar.error || maintenance.error);
  const bookings = calendar.data?.adminCalendar ?? [];
  const windows = maintenance.data?.officeMaintenance ?? [];
  const days = useMemo(
    () => buildCalendarDays(bookings, windows, range),
    [bookings, windows, range],
  );
  const visibleDays = showAllDays ? days : days.slice(0, DAY_LIMIT);

  return (
    <div>
      <PageHeader
        title="Calendar"
        sub="Every booking across all rooms, day by day"
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
              icon={<LuChartColumn aria-hidden />}
              onClick={() => navigate('/admin/analytics')}
            >
              View Analytics
            </Button>
          </div>
        }
      />

      <AppCard>
        <RangePicker range={range} onChange={setRange} />
        {rangeValid && !failed && (
          <p className="mt-4 text-sm text-muted">
            {plural(bookings.length, 'booking', 'bookings')} ·{' '}
            {plural(windows.length, 'maintenance window', 'maintenance windows')}{' '}
            · {plural(days.length, 'day', 'days')} with activity
          </p>
        )}
      </AppCard>

      {!rangeValid ? (
        <ErrorState message="Choose a start date that is on or before the end date to see the calendar." />
      ) : failed ? (
        <div className="mt-5">
          <ErrorState
            message="Could not load the office calendar."
            onRetry={refetchRange}
          />
        </div>
      ) : loading && days.length === 0 ? (
        <div className="mt-5">
          <LoadingState />
        </div>
      ) : days.length === 0 ? (
        <div className="mt-5">
          <EmptyState message="No bookings or maintenance in this range." />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5" aria-busy={loading}>
          {visibleDays.map((day) => (
            <PanelCard
              key={day.date}
              title={formatDayHeading(day.date)}
              sub={daySummary(day.entries)}
            >
              <div className="flex flex-col">
                {day.entries.map((entry) => (
                  <CalendarEntryRow
                    key={entryKey(entry)}
                    entry={entry}
                    now={now}
                  />
                ))}
              </div>
            </PanelCard>
          ))}

          {days.length > DAY_LIMIT && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                Showing the {DAY_LIMIT} earliest of {plural(days.length, 'day', 'days')}{' '}
                with activity.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowAllDays((value) => !value)}
              >
                {showAllDays ? 'Show less' : `Show all ${days.length}`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const daySummary = (entries: CalendarEntry[]): string => {
  const bookings = entries.filter((entry) => entry.kind === 'booking').length;
  return `${plural(bookings, 'booking', 'bookings')} · ${plural(
    entries.length - bookings,
    'maintenance window',
    'maintenance windows',
  )}`;
};

const entryKey = (entry: CalendarEntry): string =>
  entry.kind === 'booking'
    ? `booking-${entry.booking.id}`
    : `maintenance-${entry.segment.window.id}`;

/**
 * One calendar row. A booking keeps the shared `BookingRow`, so it links to its
 * details page like every other booking row in the app; a maintenance window
 * reuses `MaintenanceRow` with a badge and its room name, because a window is
 * not a bookable entity and has nothing to link to.
 *
 * The window's times are the ones it occupies *on this day*, so a window that
 * began earlier is not repeated here as a start time in the past; a window
 * spanning more than one day also states its whole span, so nothing is lost by
 * the clipping.
 */
const CalendarEntryRow = ({
  entry,
  now,
}: {
  entry: CalendarEntry;
  now: Date;
}) => {
  if (entry.kind === 'booking') {
    return <BookingRow booking={entry.booking} />;
  }

  const { segment } = entry;
  const { window } = segment;
  // "In progress" belongs to the day it is true on: a card for a past day of a
  // window that is running now must not claim to be in progress.
  const note = [
    isActiveMaintenance(window, now) && isSameLocalDay(segment.day, now)
      ? 'In progress'
      : null,
    segment.spansMoreDays
      ? `Runs ${formatDateTime(window.startTime)} – ${formatDateTime(window.endTime)}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <MaintenanceRow
      window={window}
      timeLabel={maintenanceSegmentLabel(segment)}
      roomName={window.room?.name}
      note={note || undefined}
      action={<StatusBadge meta={maintenanceWindowMeta} />}
    />
  );
};
