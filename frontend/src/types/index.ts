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
