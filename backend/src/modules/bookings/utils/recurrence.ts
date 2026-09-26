import { randomUUID } from 'node:crypto';
import { ValidationError } from '../../../common/errors';

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export interface BookingOccurrence {
  startTime: Date;
  endTime: Date;
}

export const MAX_RECURRENCE_OCCURRENCES = 90;

const FREQUENCY_STEP_DAYS: Record<RecurrenceFrequency, number> = {
  [RecurrenceFrequency.DAILY]: 1,
  [RecurrenceFrequency.WEEKLY]: 7,
};

const addDays = (date: Date, days: number): Date => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const countOccurrences = (
  startTime: Date,
  stepDays: number,
  endDate: Date,
): number => {
  let count = 0;
  let cursor = new Date(startTime);
  while (cursor.getTime() <= endDate.getTime()) {
    count += 1;
    cursor = addDays(cursor, stepDays);
  }
  return count;
};

const occurrencesOverlap = (
  first: BookingOccurrence,
  second: BookingOccurrence,
): boolean =>
  first.startTime < second.endTime && second.startTime < first.endTime;

export const generateOccurrences = (
  startTime: Date,
  endTime: Date,
  frequency: RecurrenceFrequency,
  endDate: Date,
): BookingOccurrence[] => {
  const stepDays = FREQUENCY_STEP_DAYS[frequency];
  if (!stepDays) {
    throw new ValidationError(
      'Recurrence frequency must be DAILY or WEEKLY.',
    );
  }

  if (endDate.getTime() < startTime.getTime()) {
    throw new ValidationError(
      'Recurrence end date must be on or after the first occurrence start time.',
    );
  }

  const totalOccurrences = countOccurrences(startTime, stepDays, endDate);
  if (totalOccurrences > MAX_RECURRENCE_OCCURRENCES) {
    throw new ValidationError(
      `A recurring series can have at most ${MAX_RECURRENCE_OCCURRENCES} occurrences (this end date would generate ${totalOccurrences}). Choose an earlier end date.`,
    );
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  const occurrences: BookingOccurrence[] = [];

  let occurrenceStart = new Date(startTime);
  while (occurrenceStart.getTime() <= endDate.getTime()) {
    occurrences.push({
      startTime: occurrenceStart,
      endTime: new Date(occurrenceStart.getTime() + durationMs),
    });
    occurrenceStart = addDays(occurrenceStart, stepDays);
  }

  for (let i = 1; i < occurrences.length; i++) {
    if (occurrencesOverlap(occurrences[i - 1], occurrences[i])) {
      throw new ValidationError(
        'The generated occurrences overlap each other. Shorten the booking duration or use a lower recurrence frequency.',
      );
    }
  }

  return occurrences;
};

export const buildRecurrenceId = (): string => `rc-${randomUUID()}`;
