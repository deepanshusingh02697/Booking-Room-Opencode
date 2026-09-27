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
