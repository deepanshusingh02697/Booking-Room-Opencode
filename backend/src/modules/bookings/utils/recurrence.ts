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

  if (occurrences.length > MAX_RECURRENCE_OCCURRENCES) {
    throw new ValidationError(
      `A recurring series can have at most ${MAX_RECURRENCE_OCCURRENCES} occurrences (this end date would generate ${occurrences.length}). Choose an earlier end date.`,
    );
  }

  for (let i = 0; i < occurrences.length; i++) {
    for (let j = i + 1; j < occurrences.length; j++) {
      if (occurrencesOverlap(occurrences[i], occurrences[j])) {
        throw new ValidationError(
          'The generated occurrences overlap each other. Shorten the booking duration or use a lower recurrence frequency.',
        );
      }
    }
  }

  return occurrences;
};

export const buildRecurrenceId = (): string => `rc-${randomUUID()}`;
