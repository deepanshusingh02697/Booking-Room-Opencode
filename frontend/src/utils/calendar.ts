import type { Booking, MaintenanceWindow } from '../types';
import {
  addDays,
  formatTime,
  startOfLocalDayValue,
  toLocalDateValue,
  type LocalDateRange,
} from './date';

/**
 * The part of a maintenance window that falls on one local day. A window is
 * filed on **every day it covers**, not only the day it starts, so a week-long
 * block shows on each of the seven days it actually takes the room away — filing
 * it under its start day alone would hide it from exactly the days it matters.
 */
export type MaintenanceSegment = {
  window: MaintenanceWindow;
  /** The local `YYYY-MM-DD` this segment covers. */
  day: string;
  /** The portion of the window visible on this day. */
  from: Date;
  /** Exclusive end on this day — local midnight when it runs to the day's end. */
  to: Date;
  /** The window covers the whole local day. */
  allDay: boolean;
  /** The window runs to the end of this day. */
  endsAtDayEnd: boolean;
  /** The window also covers another day, so the row states the full span. */
  spansMoreDays: boolean;
};

export type CalendarEntry =
  | { kind: 'booking'; startTime: string; booking: Booking }
  | { kind: 'maintenance'; startTime: string; segment: MaintenanceSegment };

export type CalendarDay = {
  /** The local `YYYY-MM-DD` the day starts on. */
  date: string;
  entries: CalendarEntry[];
};

const dayKey = (value: string | Date): string => toLocalDateValue(value);

/** Every local `YYYY-MM-DD` from `from` to `to` inclusive. */
const eachDay = (from: string, to: string): string[] => {
  const days: string[] = [];
  let cursor = startOfLocalDayValue(from);
  const last = startOfLocalDayValue(to);
  while (cursor.getTime() <= last.getTime()) {
    days.push(dayKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
};

/**
 * Clips a window to one day. `to` is the local midnight that *ends* the day, so
 * a window running to the end of the day is recognised as ending at `24:00`
 * rather than rendering as a zero-length 00:00–00:00 segment.
 */
const segmentOnDay = (
  window: MaintenanceWindow,
  day: string,
  spansMoreDays: boolean,
): MaintenanceSegment => {
  const dayStart = startOfLocalDayValue(day);
  const dayEnd = addDays(dayStart, 1);
  const from = new Date(
    Math.max(new Date(window.startTime).getTime(), dayStart.getTime()),
  );
  const to = new Date(Math.min(new Date(window.endTime).getTime(), dayEnd.getTime()));
  return {
    window,
    day,
    from,
    to,
    allDay: from.getTime() <= dayStart.getTime() && to.getTime() >= dayEnd.getTime(),
    endsAtDayEnd: to.getTime() >= dayEnd.getTime(),
    spansMoreDays,
  };
};

/**
 * Groups bookings and maintenance windows into local-day agendas, earliest day
 * first and, inside a day, earliest start first (a booking wins a tie, so a
 * booking and a window that begin together read booking-first).
 *
 * A booking is filed under the local day it *starts* on. A window is filed under
 * every day it covers, clipped to that day, and never outside `range` — the
 * range is the query's own answer, so a window the server did not return cannot
 * leak into a day it does not belong to.
 *
 * Days with nothing on them are dropped, so an empty week is one empty state
 * rather than seven empty cards.
 */
export const buildCalendarDays = (
  bookings: Booking[],
  windows: MaintenanceWindow[],
  range: LocalDateRange,
): CalendarDay[] => {
  const days = new Map<string, CalendarEntry[]>();

  const push = (date: string, entry: CalendarEntry) => {
    const existing = days.get(date);
    if (existing) {
      existing.push(entry);
    } else {
      days.set(date, [entry]);
    }
  };

  for (const booking of bookings) {
    push(dayKey(booking.startTime), {
      kind: 'booking',
      startTime: booking.startTime,
      booking,
    });
  }

  const rangeFrom = startOfLocalDayValue(range.from);
  const rangeEnd = addDays(startOfLocalDayValue(range.to), 1);
  for (const window of windows) {
    // The same half-open overlap the server applies: a window starting exactly
    // at the range's end, or ending exactly at its start, is outside it.
    const first = Math.max(new Date(window.startTime).getTime(), rangeFrom.getTime());
    const last = Math.min(new Date(window.endTime).getTime(), rangeEnd.getTime());
    if (first >= last) {
      continue;
    }
    const covered = eachDay(dayKey(new Date(first)), dayKey(new Date(last - 1)));
    if (covered.length === 0) {
      continue;
    }
    const spansMoreDays = covered.length > 1;
    for (const day of covered) {
      const segment = segmentOnDay(window, day, spansMoreDays);
      push(day, {
        kind: 'maintenance',
        // Sorted by the clipped start, so a window that began on an earlier day
        // lands at the top of this day's agenda, where the room is blocked.
        startTime: segment.from.toISOString(),
        segment,
      });
    }
  }

  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({
      date,
      entries: entries.sort((a, b) => {
        const byStart = a.startTime.localeCompare(b.startTime);
        return byStart !== 0 ? byStart : a.kind.localeCompare(b.kind);
      }),
    }));
};

/**
 * The clock range a segment occupies on its own day: `All day` when the window
 * covers the whole day, otherwise the clipped times, with an end at the day's
 * boundary written as `24:00` rather than the confusing `00:00`.
 */
export const maintenanceSegmentLabel = (segment: MaintenanceSegment): string =>
  segment.allDay
    ? 'All day'
    : `${formatTime(segment.from)} – ${
        segment.endsAtDayEnd ? '24:00' : formatTime(segment.to)
      }`;
