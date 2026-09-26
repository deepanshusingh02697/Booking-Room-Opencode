import { logger } from '../../../common/logger';
import {
  notificationEventName,
  toNotificationEventPayload,
} from '../../../realtime/events';
import { emitToUser } from '../../../realtime/socket';
import { Employee } from '../../auth/entities/employee';
import { Booking } from '../../bookings/entities/booking';
import { Room } from '../../rooms/entities/room';
import { WaitlistEntry } from '../../waitlist/entities/waitlist-entry';
import { NotificationPayload } from '../dto/notification-payload';
import {
  buildBookingCheckedInNotification,
  buildBookingCreatedNotifications,
  buildParticipantAddedNotifications,
  buildParticipantRemovedNotification,
  buildWaitlistConvertedNotification,
} from '../utils/payload-builders';

export class NotificationService {
  async bookingCreated(
    booking: Booking,
    room: Room,
    organizer: Employee,
    participants: Employee[],
  ): Promise<void> {
    const notifications = buildBookingCreatedNotifications(
      booking,
      room,
      organizer,
      participants,
    );
    notifications.forEach((notification) => this.emit(notification));
  }

  async participantsAdded(
    booking: Booking,
    room: Room,
    organizer: Employee,
    employees: Employee[],
  ): Promise<void> {
    const notifications = buildParticipantAddedNotifications(
      booking,
      room,
      organizer,
      employees,
    );
    notifications.forEach((notification) => this.emit(notification));
  }

  async participantRemoved(
    booking: Booking,
    room: Room,
    organizer: Employee,
    employee: Employee,
  ): Promise<void> {
    this.emit(
      buildParticipantRemovedNotification(booking, room, organizer, employee),
    );
  }

  async bookingCheckedIn(
    booking: Booking,
    room: Room,
    organizer: Employee,
    checkedInBy: Employee,
  ): Promise<void> {
    this.emit(
      buildBookingCheckedInNotification(booking, room, organizer, checkedInBy),
    );
  }

  async waitlistConverted(
    booking: Booking,
    room: Room,
    convertedEmployee: Employee,
    waitlistEntry: WaitlistEntry,
  ): Promise<void> {
    this.emit(
      buildWaitlistConvertedNotification(
        booking,
        room,
        convertedEmployee,
        waitlistEntry,
      ),
    );
  }

  private emit(notification: NotificationPayload): void {
    this.log(notification);
    emitToUser(
      notification.recipientId,
      notificationEventName(notification.type),
      toNotificationEventPayload(notification),
    );
  }

  private log(notification: NotificationPayload): void {
    const action = {
      BOOKING_CREATED: 'invited to',
      PARTICIPANT_ADDED: 'added to',
      PARTICIPANT_REMOVED: 'removed from',
      CHECK_IN: 'checked in to',
      WAITLIST_CONVERTED: 'was booked from the waitlist for',
    }[notification.type];
    logger.info(
      `[notification:${notification.type}] user ${notification.recipientId} ${action} "${notification.title}" in ${notification.roomName}`,
      {
        bookingId: notification.bookingId,
        organizer: notification.organizerName,
        startTime: notification.startTime.toISOString(),
        endTime: notification.endTime.toISOString(),
        ...(notification.type === 'WAITLIST_CONVERTED'
          ? {
              waitlistStartTime: notification.waitlistStartTime.toISOString(),
              waitlistEndTime: notification.waitlistEndTime.toISOString(),
            }
          : {}),
      },
    );
  }
}
