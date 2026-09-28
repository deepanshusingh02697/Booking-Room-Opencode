export const NOTIFICATION_EVENTS = {
  BOOKING_CREATED: 'notification:BOOKING_CREATED',
  PARTICIPANT_ADDED: 'notification:PARTICIPANT_ADDED',
  PARTICIPANT_REMOVED: 'notification:PARTICIPANT_REMOVED',
  CHECK_IN: 'notification:CHECK_IN',
  WAITLIST_CONVERTED: 'notification:WAITLIST_CONVERTED',
} as const;

export type NotificationEventName =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export type NotificationType = NotificationEventName;

export interface NotificationEventPayload {
  type: NotificationType;
  recipientId: number;
  bookingId: number;
  title: string;
  roomName: string;
  startTime: string;
  endTime: string;
  organizerName: string;
  checkedInByName?: string;
  waitlistStartTime?: string;
  waitlistEndTime?: string;
}