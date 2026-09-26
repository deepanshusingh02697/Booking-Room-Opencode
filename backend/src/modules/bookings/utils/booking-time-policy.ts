export const BOOKING_CHANGE_WINDOW_MINUTES = 30;

const BOOKING_CHANGE_WINDOW_MS =
  BOOKING_CHANGE_WINDOW_MINUTES * 60 * 1000;

export const getBookingChangeCutoff = (startTime: Date): Date =>
  new Date(startTime.getTime() - BOOKING_CHANGE_WINDOW_MS);

export const isBookingChangeWindowOpen = (
  startTime: Date,
  now: Date,
): boolean => now.getTime() < getBookingChangeCutoff(startTime).getTime();
