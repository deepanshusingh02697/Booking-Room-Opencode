export const UserRole = {
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RoomStatus = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  DISABLED: 'DISABLED',
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const BookingStatus = {
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const RecurrenceFrequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
} as const;

export type RecurrenceFrequency =
  (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface Equipment {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  floor: number;
  location: string;
  status: RoomStatus;
  occupantCount?: number;
  remainingCapacity?: number;
  equipment?: Equipment[];
}

export interface Participant {
  id: number;
  bookingId: number;
  employeeId: number;
  employee?: Employee;
}

export interface CheckIn {
  id: number;
  bookingId: number;
  checkedInBy: number;
  checkedInAt: string;
  employee?: Employee;
}

export interface Booking {
  id: number;
  roomId: number;
  organizerId: number;
  title: string;
  description?: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  recurrenceId?: string;
  hasCheckedIn?: boolean;
  checkIn?: CheckIn;
  /**
   * The check-in window bounds, published by the server so the client never
   * mirrors `CHECK_IN_WINDOW_MINUTES`. `checkInWindowOpensAt` is the booking's
   * own `startTime`; the window closes 10 minutes after it.
   */
  checkInWindowOpensAt?: string;
  checkInWindowClosesAt?: string;
  createdAt?: string;
  updatedAt?: string;
  room?: Room;
  organizer?: Employee;
  participants?: Participant[];
}

export interface RoomUsage {
  roomId: number;
  roomName: string;
  totalBookings: number;
  cancellations: number;
  noShows: number;
}

/**
 * One wait-list entry (FR-33): the signed-in employee queued for a room and a
 * window. The server returns every entry it holds for the user, unfiltered, so
 * the client splits them into waiting and passed itself.
 */
export interface WaitlistEntry {
  id: number;
  roomId: number;
  employeeId: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  room?: Room;
  employee?: Employee;
}

/**
 * One maintenance window (FR-41): a room is blocked from booking while a window
 * runs, regardless of the room's own status. The server returns every window
 * for a room, unfiltered, in `startTime ASC, id ASC` order, so the client
 * splits them into scheduled and past itself.
 */
export interface MaintenanceWindow {
  id: number;
  roomId: number;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt?: string;
  room?: Room;
}

export type NotificationType =
  | 'notification:BOOKING_CREATED'
  | 'notification:PARTICIPANT_ADDED'
  | 'notification:PARTICIPANT_REMOVED'
  | 'notification:CHECK_IN'
  | 'notification:WAITLIST_CONVERTED';

export interface Notification {
  id: string;
  type: NotificationType;
  bookingId: number;
  title: string;
  roomName: string;
  startTime: string;
  endTime: string;
  organizerName: string;
  message: string;
  timestamp: number;
  read: boolean;
  waitlistStartTime?: string;
  waitlistEndTime?: string;
  checkedInByName?: string;
}
