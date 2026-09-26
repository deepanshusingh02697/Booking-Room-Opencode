import { Employee } from '../../auth/entities/employee';
import { Booking } from '../../bookings/entities/booking';
import { Room } from '../../rooms/entities/room';
import { WaitlistEntry } from '../../waitlist/entities/waitlist-entry';
import {
  BookingCheckedInNotification,
  BookingCreatedNotification,
  ParticipantAddedNotification,
  ParticipantRemovedNotification,
  WaitlistConvertedNotification,
} from '../dto/notification-payload';

const toBookingNotification = (
  booking: Booking,
  room: Room,
  organizer: Employee,
  recipient: Employee,
) => ({
  recipientId: recipient.id,
  bookingId: booking.id,
  title: booking.title,
  roomName: room.name,
  startTime: booking.startTime,
  endTime: booking.endTime,
  organizerName: `${organizer.firstName} ${organizer.lastName}`,
});

export const buildBookingCreatedNotifications = (
  booking: Booking,
  room: Room,
  organizer: Employee,
  participants: Employee[],
): BookingCreatedNotification[] =>
  participants.map((participant) => ({
    type: 'BOOKING_CREATED' as const,
    ...toBookingNotification(booking, room, organizer, participant),
  }));

export const buildParticipantAddedNotifications = (
  booking: Booking,
  room: Room,
  organizer: Employee,
  employees: Employee[],
): ParticipantAddedNotification[] =>
  employees.map((employee) => ({
    type: 'PARTICIPANT_ADDED' as const,
    ...toBookingNotification(booking, room, organizer, employee),
  }));

export const buildParticipantRemovedNotification = (
  booking: Booking,
  room: Room,
  organizer: Employee,
  employee: Employee,
): ParticipantRemovedNotification => ({
  type: 'PARTICIPANT_REMOVED' as const,
  ...toBookingNotification(booking, room, organizer, employee),
});

export const buildBookingCheckedInNotification = (
  booking: Booking,
  room: Room,
  organizer: Employee,
  checkedInBy: Employee,
): BookingCheckedInNotification => ({
  type: 'CHECK_IN' as const,
  ...toBookingNotification(booking, room, organizer, organizer),
  checkedInByName: `${checkedInBy.firstName} ${checkedInBy.lastName}`,
});

export const buildWaitlistConvertedNotification = (
  booking: Booking,
  room: Room,
  convertedEmployee: Employee,
  waitlistEntry: WaitlistEntry,
): WaitlistConvertedNotification => ({
  type: 'WAITLIST_CONVERTED' as const,
  ...toBookingNotification(booking, room, convertedEmployee, convertedEmployee),
  waitlistStartTime: waitlistEntry.startTime,
  waitlistEndTime: waitlistEntry.endTime,
});
