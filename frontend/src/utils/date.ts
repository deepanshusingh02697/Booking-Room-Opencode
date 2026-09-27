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

export const formatTime = (value: string | Date): string => {
  const d = new Date(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatTimeRange = (start: string | Date, end: string | Date): string =>
  `${formatTime(start)} – ${formatTime(end)}`;
