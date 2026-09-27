import { RecurrenceFrequency, type Booking } from '../types';
import { endOfLocalDay, toGraphQLDate } from './date';

/**
 * The client-side mirror of `backend/src/modules/bookings/utils/recurrence.ts`.
 * It exists so the Create Booking form can show the user exactly which
 * occurrences a series would create, and flag a series the server would reject,
 * before they submit. It is advisory only: the server re-generates and
 * re-validates every occurrence and its message is what the user ultimately
 * sees. The algorithm is copied step for step on purpose — calendar-day
 * stepping (so a DST shift never moves the time of day) and the half-open
 * overlap test are both load-bearing, and a shortcut would drift from the server
 * on the edges.
 */
export const MAX_RECURRENCE_OCCURRENCES = 90;

const STEP_DAYS: Record<RecurrenceFrequency, number> = {
  [RecurrenceFrequency.DAILY]: 1,
  [RecurrenceFrequency.WEEKLY]: 7,
};

/** Calendar-day stepping, matching the server's `setDate` arithmetic. */
const addDays = (date: Date, days: number): Date => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

export type OccurrencePreview = {
  /** The start of every occurrence, in order. Empty when `error` is set. */
  starts: Date[];
  /** The server's rule in our own words. Non-null means the series is invalid. */
  error: string | null;
};

const invalid = (error: string): OccurrencePreview => ({ starts: [], error });

/**
 * Generate the occurrence start times the server would generate, or the reason it
 * would refuse. Mirrors `generateOccurrences`: the end date is inclusive (an
 * occurrence starting exactly on it counts), and a booking longer than the
 * cadence makes two occurrences overlap.
 */
export const previewOccurrences = ({
  startTime,
  endTime,
  frequency,
  endDate,
}: {
  startTime: Date;
  endTime: Date;
  frequency: RecurrenceFrequency;
  endDate: Date;
}): OccurrencePreview => {
  const stepDays = STEP_DAYS[frequency];
  const durationMs = endTime.getTime() - startTime.getTime();

  if (endDate.getTime() < startTime.getTime()) {
    return invalid('Repeat-until must be on or after the first booking.');
  }

  const starts: Date[] = [];
  let cursor = new Date(startTime);
  // Bounded so a far-future date cannot spin here: the cap is 90, and the
  // first date that would generate more than that is the one the server refuses.
  while (
    cursor.getTime() <= endDate.getTime() &&
    starts.length <= MAX_RECURRENCE_OCCURRENCES
  ) {
    starts.push(new Date(cursor));
    cursor = addDays(cursor, stepDays);
  }

  if (starts.length > MAX_RECURRENCE_OCCURRENCES) {
    return invalid(
      `A series can have at most ${MAX_RECURRENCE_OCCURRENCES} occurrences. Choose an earlier date.`,
    );
  }

  for (let index = 1; index < starts.length; index += 1) {
    // Half-open, exactly as the server tests it, so a booking ending precisely
    // when the next one starts does not count as an overlap.
    const firstStart = starts[index - 1].getTime();
    const firstEnd = firstStart + durationMs;
    const secondStart = starts[index].getTime();
    const secondEnd = secondStart + durationMs;
    if (firstStart < secondEnd && secondStart < firstEnd) {
      return invalid(
        'The occurrences would overlap each other. Shorten the booking, or repeat less often.',
      );
    }
  }

  return { starts, error: null };
};

/** The same end-of-day instant, in the full ISO form the `Date` scalar wants. */
export const repeatUntilToGraphQLDate = (dateValue: string): string =>
  toGraphQLDate(endOfLocalDay(dateValue));

/** "Every day" / "Every week", for a chooser. */
export const frequencyLabel: Record<RecurrenceFrequency, string> = {
  [RecurrenceFrequency.DAILY]: 'Every day',
  [RecurrenceFrequency.WEEKLY]: 'Every week',
};

/** "every day" / "every week", for copy that reads as prose. */
export const frequencyAdverb = (frequency: RecurrenceFrequency): string =>
  frequency === RecurrenceFrequency.DAILY ? 'every day' : 'every week';

/**
 * How often a series repeats, inferred from the gaps between its occurrences.
 * `BookingType` carries no frequency — only the shared `recurrenceId` — so a
 * list holding two or more occurrences of the same series can read the cadence
 * off them. A single occurrence proves nothing, so the caller falls back to a
 * note that claims no frequency.
 */
const inferFrequency = (starts: Date[]): RecurrenceFrequency | null => {
  if (starts.length < 2) return null;
  const sorted = [...starts].sort((a, b) => a.getTime() - b.getTime());
  const smallestGap = Math.min(
    ...sorted.slice(1).map((value, index) => value.getTime() - sorted[index].getTime()),
  );
  for (const frequency of [RecurrenceFrequency.DAILY, RecurrenceFrequency.WEEKLY]) {
    // Under a second of slack, so a DST-shifted 23- or 25-hour day still reads
    // as the cadence it was created with.
    if (
      Math.abs(smallestGap - STEP_DAYS[frequency] * 24 * 60 * 60 * 1000) <
      1000
    ) {
      return frequency;
    }
  }
  return null;
};

/**
 * A per-series note for booking rows: `Repeats every day` / `Repeats every week`
 * where the list can prove it, and a plain `Repeats` where it cannot.
 */
export const buildRecurrenceNotes = (
  bookings: Booking[],
): Map<string, string> => {
  const bySeries = new Map<string, Date[]>();
  for (const booking of bookings) {
    if (!booking.recurrenceId) continue;
    const starts = bySeries.get(booking.recurrenceId) ?? [];
    starts.push(new Date(booking.startTime));
    bySeries.set(booking.recurrenceId, starts);
  }

  const notes = new Map<string, string>();
  for (const [recurrenceId, starts] of bySeries) {
    const frequency = inferFrequency(starts);
    notes.set(
      recurrenceId,
      frequency ? `Repeats ${frequencyAdverb(frequency)}` : 'Repeats',
    );
  }
  return notes;
};

/**
 * The second line of a `BookingRow`, combining whatever context the row already
 * carries (`In progress`, `Organiser`, `Invited`) with the series note. Undefined
 * when there is nothing to say, so the row renders exactly as it did before
 * recurrence existed.
 */
export const bookingRowNote = (
  booking: Booking,
  recurrenceNotes: Map<string, string>,
  extra?: string,
): string | undefined => {
  const parts = [
    extra,
    booking.recurrenceId ? recurrenceNotes.get(booking.recurrenceId) : undefined,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : undefined;
};
