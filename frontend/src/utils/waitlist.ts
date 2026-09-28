import type { WaitlistEntry } from '../types';
import { isFuture } from './date';

/**
 * The wait-list derivations the UI needs, in one place so Create Booking, Room
 * Details, My Bookings and the Wait-List page cannot drift apart.
 *
 * These only ever compare rows the *signed-in user already owns* against each
 * other. They never claim anything about the room, the bookings or other
 * people's queues — that stays the server's call (doc/project-state.md §8.4).
 */

/**
 * Half-open window overlap, mirroring
 * `WaitlistRepository.findOverlappingForEmployee` /
 * `findFifoOverlappingForRoom`: `start < otherEnd AND end > otherStart`, so
 * abutting windows (one ends exactly when the other starts) do not count.
 */
export const windowsOverlap = (
  start: string | Date,
  end: string | Date,
  otherStart: string | Date,
  otherEnd: string | Date,
): boolean =>
  new Date(start).getTime() < new Date(otherEnd).getTime() &&
  new Date(end).getTime() > new Date(otherStart).getTime();

/**
 * An entry is still actionable while its window has not finished. `endTime` is
 * the test rather than `startTime`, so a window that is running right now is
 * still listed as waiting.
 */
export const isActiveWaitlistEntry = (
  entry: WaitlistEntry,
  now: Date = new Date(),
): boolean => isFuture(entry.endTime, now);

export const activeWaitlistEntries = (
  entries: WaitlistEntry[],
  now: Date = new Date(),
): WaitlistEntry[] => entries.filter((entry) => isActiveWaitlistEntry(entry, now));

/** Waiting soonest-first, passed most-recent-first. */
export const sortWaitlistByWindow = (
  entries: WaitlistEntry[],
  direction: 'asc' | 'desc',
): WaitlistEntry[] =>
  [...entries].sort(
    (a, b) =>
      (new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) *
      (direction === 'asc' ? 1 : -1),
  );

/**
 * The user's own entry for this room covering any part of the window, i.e. the
 * mirror of the server's duplicate refusal. Returns the earliest joined so the
 * UI can name the single entry the user already holds.
 */
export const ownWaitlistEntryForWindow = (
  entries: WaitlistEntry[],
  roomId: number,
  start: string | Date,
  end: string | Date,
): WaitlistEntry | undefined =>
  entries
    .filter(
      (entry) =>
        entry.roomId === roomId && windowsOverlap(entry.startTime, entry.endTime, start, end),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];

/**
 * The "Book this slot" deep link: Create Booking with the room and the exact
 * window already filled in. `URLSearchParams` does the encoding, and the room
 * param is the one Create Booking has always understood.
 */
export const bookSlotHref = (entry: WaitlistEntry): string => {
  const params = new URLSearchParams({
    room: String(entry.roomId),
    start: entry.startTime,
    end: entry.endTime,
  });
  return `/create-booking?${params.toString()}`;
};
