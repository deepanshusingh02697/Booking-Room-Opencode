import { NotificationPayload } from '../modules/notifications/dto/notification-payload';

/**
 * One socket event per notification type. The names mirror the
 * `[notification:<TYPE>]` server log tag, so a log line and an emitted event for
 * the same notification are trivially matched.
 */
export const NOTIFICATION_EVENTS = {
  BOOKING_CREATED: 'notification:BOOKING_CREATED',
  PARTICIPANT_ADDED: 'notification:PARTICIPANT_ADDED',
  PARTICIPANT_REMOVED: 'notification:PARTICIPANT_REMOVED',
  CHECK_IN: 'notification:CHECK_IN',
  WAITLIST_CONVERTED: 'notification:WAITLIST_CONVERTED',
} as const;

export type NotificationType = NotificationPayload['type'];

export type NotificationEventName =
  (typeof NOTIFICATION_EVENTS)[NotificationType];

export const notificationEventName = (
  type: NotificationType,
): NotificationEventName => NOTIFICATION_EVENTS[type];

/**
 * The wire shape of a notification. Identical to `NotificationPayload` except
 * that every date is an ISO-8601 string — Socket.io transports JSON, so a `Date`
 * would silently become a string anyway; making it explicit keeps the client
 * contract honest.
 */
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

export const toNotificationEventPayload = (
  notification: NotificationPayload,
): NotificationEventPayload => {
  const base = {
    type: notification.type,
    recipientId: notification.recipientId,
    bookingId: notification.bookingId,
    title: notification.title,
    roomName: notification.roomName,
    startTime: notification.startTime.toISOString(),
    endTime: notification.endTime.toISOString(),
    organizerName: notification.organizerName,
  };

  if (notification.type === 'CHECK_IN') {
    return { ...base, checkedInByName: notification.checkedInByName };
  }

  if (notification.type === 'WAITLIST_CONVERTED') {
    return {
      ...base,
      waitlistStartTime: notification.waitlistStartTime.toISOString(),
      waitlistEndTime: notification.waitlistEndTime.toISOString(),
    };
  }

  return base;
};
