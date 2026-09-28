import { ValidationError } from './errors';

/**
 * A half-open date range, `[startTime, endTime)`, as every range query in the
 * app receives it. The bounds are interpreted that way by the overlap tests
 * themselves (`startTime < rangeEnd AND endTime > rangeStart`), so a booking or
 * window starting exactly at `endTime` is outside the range and one ending
 * exactly at `startTime` is too.
 */
export interface DateRange {
  startTime: Date;
  endTime: Date;
}

/**
 * The one range rule: a range must start before it ends. Shared by every
 * service that takes a `DateRangeInput` (analytics' `adminCalendar` /
 * `usageAnalytics`, and the maintenance module's `officeMaintenance`) so the
 * rule and its message live in exactly one place — a second copy is a message
 * that can drift.
 *
 * Ordering is validated here rather than with class-validator on the DTO: the
 * codebase convention is that the `DateTimeISO` scalar enforces shape and the
 * service owns range rules (see `dto/date-range-input.ts`).
 */
export const assertValidDateRange = (range: DateRange): void => {
  if (range.startTime >= range.endTime) {
    throw new ValidationError('Date range start time must be before end time.');
  }
};
