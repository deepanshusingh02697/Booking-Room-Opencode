const pad = (value: number): string => String(value).padStart(2, '0');

export const startOfToday = (now: Date = new Date()): Date => {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfToday = (now: Date = new Date()): Date => {
  const d = startOfToday(now);
  d.setDate(d.getDate() + 1);
  return d;
};

export const startOfTomorrow = (now: Date = new Date()): Date => {
  const d = endOfToday(now);
  return d;
};

export const toGraphQLDate = (d: Date): string =>
  d.toISOString().replace(/\.\d{3}Z$/, 'Z');

export const localInputToGraphQLDate = (value: string): string =>
  toGraphQLDate(new Date(value));

/** `YYYY-MM-DDTHH:mm` in browser-local time, the value a datetime-local input expects. */
export const toLocalInputValue = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;

/** `YYYY-MM-DD` in browser-local time, the value a date input expects. */
export const toLocalDateValue = (value: string | Date): string => {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * The end of a `YYYY-MM-DD` calendar day, in browser-local time. Used to read a
 * picked "repeat until" date as inclusive of that whole day — the server
 * compares exact timestamps, so a bare midnight would drop the last day.
 */
export const endOfLocalDay = (dateValue: string): Date => {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

/** The next half-hour boundary strictly after `now`, as a datetime-local value. */
export const nextHalfHourInput = (now: Date = new Date()): string => {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + (d.getMinutes() % 30 === 0 ? 30 : 60 - (d.getMinutes() % 30)));
  return toLocalInputValue(d);
};

export const addMinutesInput = (value: string, minutes: number): string => {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalInputValue(d);
};

/**
 * Calendar-day stepping via `setDate`, so the time of day survives a DST change
 * — the same arithmetic the server's recurrence generator uses.
 */
export const addDaysInput = (value: string, days: number): string => {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return toLocalInputValue(d);
};

/**
 * A default booking slot: the next half-hour boundary, one hour long.
 * Both ends are derived from one reading of the clock so they can never drift
 * apart across a half-hour boundary.
 */
export const defaultSlotInput = (
  now: Date = new Date(),
  minutes = 60,
): { startTime: string; endTime: string } => {
  const start = nextHalfHourInput(now);
  return { startTime: start, endTime: addMinutesInput(start, minutes) };
};

export const formatDateTime = (value: string | Date): string => {
  const d = new Date(value);
  return `${d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })} · ${formatTime(d)}`;
};

export const todayRangeInput = (now: Date = new Date()) => ({
  startTime: toGraphQLDate(startOfToday(now)),
  endTime: toGraphQLDate(endOfToday(now)),
});

export const isSameLocalDay = (value: string | Date, now: Date = new Date()): boolean => {
  const d = new Date(value);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

export const isAfterLocalDay = (value: string | Date, day: Date): boolean => {
  const d = new Date(value);
  return d.getTime() >= day.getTime();
};

export const isFuture = (value: string | Date, now: Date = new Date()): boolean =>
  new Date(value).getTime() > now.getTime();

/** True while `now` is between start and end, i.e. the meeting is running. */
export const isInProgress = (
  start: string | Date,
  end: string | Date,
  now: Date = new Date(),
): boolean => {
  const t = now.getTime();
  return new Date(start).getTime() <= t && t < new Date(end).getTime();
};

export const minutesUntil = (value: string | Date, now: Date = new Date()): number =>
  Math.round((new Date(value).getTime() - now.getTime()) / 60000);

export const formatTime = (value: string | Date): string => {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatTimeRange = (start: string | Date, end: string | Date): string =>
  `${formatTime(start)} – ${formatTime(end)}`;

/** Calendar-day stepping on a `Date`, so the time of day survives a DST change. */
export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Local midnight of a `YYYY-MM-DD` value — the inclusive start of that day. */
export const startOfLocalDayValue = (dateValue: string): Date => {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/** Local midnight of the day *after* a `YYYY-MM-DD` value — the exclusive end. */
const startOfNextLocalDayValue = (dateValue: string): Date =>
  addDays(startOfLocalDayValue(dateValue), 1);

/** A day range as the two `YYYY-MM-DD` values a date input holds. */
export interface LocalDateRange {
  from: string;
  to: string;
}

/** A day range as the `DateRangeInput` the analytics queries take. */
export interface GraphQLDateRange {
  startTime: string;
  endTime: string;
}

/**
 * A `LocalDateRange` as the GraphQL range the admin queries expect.
 *
 * The end is the *exclusive* start of the following day, because both queries
 * match on half-open interval overlap (`startTime < rangeEnd AND endTime >
 * rangeStart`): a booking starting exactly at midnight of the day after `to`
 * must not appear, while everything inside the picked days must.
 */
export const localDateRangeToGraphQL = (
  range: LocalDateRange,
): GraphQLDateRange => ({
  startTime: toGraphQLDate(startOfLocalDayValue(range.from)),
  endTime: toGraphQLDate(startOfNextLocalDayValue(range.to)),
});

export type DateRangePresetId = 'today' | 'week' | 'month' | 'last30';

export type DateRangePreset = {
  id: DateRangePresetId;
  label: string;
  /** Both bounds come from one `now`, so a range can never straddle midnight. */
  build: (now: Date) => LocalDateRange;
};

const localDay = (value: string | Date): string => toLocalDateValue(value);

/** Monday of the week `now` falls in, at local midnight. */
const startOfLocalWeek = (now: Date): Date =>
  addDays(startOfToday(now), -((now.getDay() + 6) % 7));

const weekPreset: DateRangePreset = {
  id: 'week',
  label: 'This week',
  build: (now) => ({
    from: localDay(startOfLocalWeek(now)),
    to: localDay(addDays(startOfLocalWeek(now), 6)),
  }),
};

/**
 * The ranges the admin Calendar and Analytics pages offer. Every bound is
 * derived from the one `now` the page reads, and "This week" starts on Monday
 * (the ISO week, matching the en-GB copy elsewhere in the app).
 */
export const dateRangePresets: DateRangePreset[] = [
  {
    id: 'today',
    label: 'Today',
    build: (now) => ({ from: localDay(now), to: localDay(now) }),
  },
  weekPreset,
  {
    id: 'month',
    label: 'This month',
    build: (now) => ({
      from: localDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: localDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }),
  },
  {
    id: 'last30',
    label: 'Last 30 days',
    build: (now) => ({
      from: localDay(addDays(startOfToday(now), -29)),
      to: localDay(now),
    }),
  },
];

export const buildDateRange = (preset: DateRangePreset, now: Date = new Date()) =>
  preset.build(now);

/**
 * The range the admin Calendar and Analytics pages open on: this week. Both
 * bounds come from one reading of the clock.
 */
export const defaultLocalDateRange = (now: Date = new Date()): LocalDateRange =>
  buildDateRange(weekPreset, now);

/** True when a range is exactly the one a preset builds from `now`. */
export const isPresetRange = (
  range: LocalDateRange,
  preset: DateRangePreset,
  now: Date,
): boolean => {
  const built = preset.build(now);
  return built.from === range.from && built.to === range.to;
};

/**
 * `Mon, 28 Sep 2026` — the heading a calendar day card carries.
 *
 * A bare `YYYY-MM-DD` is read as local midnight, never handed to `new Date`
 * (which parses it as UTC midnight and prints the *previous* day for anyone
 * west of Greenwich).
 */
export const formatDayHeading = (value: string | Date): string => {
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? startOfLocalDayValue(value)
    : new Date(value);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};
