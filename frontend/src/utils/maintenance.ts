import type { MaintenanceWindow } from '../types';

/**
 * A window the server has not finished yet — active or upcoming. A maintenance
 * window blocks bookings until it *ends*, so the split is on `endTime`, exactly
 * like the wait-list's "waiting until the window ends" rule (§9.9).
 */
export const isScheduledMaintenance = (
  window: MaintenanceWindow,
  now: Date = new Date(),
): boolean => new Date(window.endTime).getTime() > now.getTime();

/** True while `now` is inside the window, i.e. the room is offline right now. */
export const isActiveMaintenance = (
  window: MaintenanceWindow,
  now: Date = new Date(),
): boolean =>
  new Date(window.startTime).getTime() <= now.getTime() &&
  now.getTime() < new Date(window.endTime).getTime();

/**
 * One clock read splits the server's unfiltered window list into `scheduled`
 * (active + upcoming, soonest first) and `past` (most recent first). The
 * server already returns `startTime ASC, id ASC`; this keeps that order for
 * scheduled and reverses it for past, so every surface that splits maintenance
 * windows shows the same two lists.
 */
export const splitMaintenanceWindows = (
  windows: MaintenanceWindow[],
  now: Date = new Date(),
): { scheduled: MaintenanceWindow[]; past: MaintenanceWindow[] } => {
  const scheduled: MaintenanceWindow[] = [];
  const past: MaintenanceWindow[] = [];
  for (const window of windows) {
    if (isScheduledMaintenance(window, now)) {
      scheduled.push(window);
    } else {
      past.push(window);
    }
  }
  scheduled.sort((a, b) => a.startTime.localeCompare(b.startTime));
  past.sort((a, b) => b.startTime.localeCompare(a.startTime));
  return { scheduled, past };
};