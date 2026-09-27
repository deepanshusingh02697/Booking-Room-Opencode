/**
 * Conflict and maintenance rejections quote the exact window that clashed, so
 * the message is only useful if a person can read it. These used to be raw
 * `toISOString()` output (`2026-11-25T12:30:00.000Z`), which the UI showed
 * verbatim in front of the user.
 *
 * The server has no notion of the browser's timezone, so the format is pinned
 * to UTC and says so, rather than rendering in the host's local zone — a
 * friendly-looking local time would quietly be wrong for every user outside it.
 */
const UTC_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** e.g. `Wed, 25 Nov 2026, 12:30 UTC`. */
export const formatConflictTime = (value: Date): string =>
  `${UTC_TIME_FORMAT.format(value)} UTC`;

/** e.g. `Wed, 25 Nov 2026, 12:30 UTC to Wed, 25 Nov 2026, 13:30 UTC`. */
export const formatConflictWindow = (startTime: Date, endTime: Date): string =>
  `${formatConflictTime(startTime)} to ${formatConflictTime(endTime)}`;
