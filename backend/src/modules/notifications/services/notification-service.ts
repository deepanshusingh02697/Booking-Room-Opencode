import { logger } from '../../../common/logger';
import { Employee } from '../../auth/entities/employee';
import { Booking } from '../../bookings/entities/booking';
import { Room } from '../../rooms/entities/room';
import { NotificationPayload } from '../dto/notification-payload';
import {
  buildBookingCreatedNotifications,
  buildParticipantAddedNotifications,
  buildParticipantRemovedNotification,
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

  private emit(notification: NotificationPayload): void {
    const action = {
      BOOKING_CREATED: 'invited to',
      PARTICIPANT_ADDED: 'added to',
      PARTICIPANT_REMOVED: 'removed from',
    }[notification.type];
    logger.info(
      `[notification:${notification.type}] user ${notification.recipientId} ${action} "${notification.title}" in ${notification.roomName}`,
      {
        bookingId: notification.bookingId,
        organizer: notification.organizerName,
        startTime: notification.startTime.toISOString(),
        endTime: notification.endTime.toISOString(),
      },
    );
  }
}
