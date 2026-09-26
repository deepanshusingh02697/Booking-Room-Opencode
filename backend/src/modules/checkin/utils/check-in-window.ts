export const CHECK_IN_WINDOW_MINUTES = 10;

export const checkInWindowEnd = (startTime: Date): Date =>
  new Date(startTime.getTime() + CHECK_IN_WINDOW_MINUTES * 60_000);

export const isCheckInWindowOpen = (startTime: Date, now: Date): boolean =>
  startTime.getTime() <= now.getTime() &&
  now.getTime() < checkInWindowEnd(startTime).getTime();
