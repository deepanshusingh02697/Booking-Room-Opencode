import type { RoomUsage } from '../types';

export type UsageSummary = {
  totalBookings: number;
  cancellations: number;
  noShows: number;
  /** Rooms with at least one booking in the range. */
  roomsWithUsage: number;
};

/**
 * The office-wide totals the analytics tiles show.
 *
 * These are sums over the rows the server returned, not a second query: Phase
 * 12 settled that `usageAnalytics` returns **every** room — an idle room as a
 * 0/0/0 row — so the rows are the complete population for the range and adding
 * them up cannot miss a booking. The three numbers also reconcile with the
 * per-room table below them, because the server counts cancellations and
 * no-shows as subsets of the total.
 */
export const summariseUsage = (rows: RoomUsage[]): UsageSummary =>
  rows.reduce<UsageSummary>(
    (summary, row) => ({
      totalBookings: summary.totalBookings + row.totalBookings,
      cancellations: summary.cancellations + row.cancellations,
      noShows: summary.noShows + row.noShows,
      roomsWithUsage: summary.roomsWithUsage + (row.totalBookings > 0 ? 1 : 0),
    }),
    { totalBookings: 0, cancellations: 0, noShows: 0, roomsWithUsage: 0 },
  );
