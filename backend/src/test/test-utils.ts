import { describe } from 'vitest';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Employee, UserRole } from '../modules/auth/entities/employee';
import { Room, RoomStatus } from '../modules/rooms/entities/room';
import { Equipment } from '../modules/equipment/entities/equipment';
import { RoomEquipment } from '../modules/equipment/entities/room-equipment';
import { Booking, BookingStatus } from '../modules/bookings/entities/booking';
import { Participant } from '../modules/participants/entities/participant';
import { CheckIn } from '../modules/checkin/entities/check-in';
import { WaitlistEntry } from '../modules/waitlist/entities/waitlist-entry';
import { Maintenance } from '../modules/maintenance/entities/maintenance';
import { AuthUser } from '../common/context';
import { DB_TESTS_ENABLED, testDataSource } from './data-source';

export { testDataSource, DB_TESTS_ENABLED };

/**
 * Wraps every DB-backed suite: skipped unless `RUN_DB_TESTS=1`, because the
 * suites truncate the development database between tests.
 */
export const describeDb = (name: string, suite: () => void): void => {
  if (DB_TESTS_ENABLED) {
    describe(name, suite);
    return;
  }
  describe.skip(name, suite);
};

const repo = <T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> =>
  testDataSource.getRepository(entity);

export const truncateTables = async (
  dataSource: DataSource = testDataSource,
): Promise<void> => {
  if (!DB_TESTS_ENABLED) {
    throw new Error(
      'Refusing to truncate: the DB suites are opt-in. Run `npm run test:db -w backend` (sets RUN_DB_TESTS=1).',
    );
  }

  const tables = [
    'check_ins',
    'waitlist_entries',
    'participants',
    'bookings',
    'room_equipment',
    'equipment',
    'maintenance',
    'rooms',
    'employees',
  ];

  for (const table of tables) {
    await dataSource.query(
      `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`,
    );
  }
};

export const createTestEmployee = async (
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
  }> = {},
): Promise<Employee> => {
  const employees = repo(Employee);
  return employees.save(
    employees.create({
      firstName: data.firstName ?? 'Test',
      lastName: data.lastName ?? 'User',
      email: data.email ?? `test-${Date.now()}@example.com`,
      password: data.password ?? 'hashedpassword',
      role: data.role ?? UserRole.EMPLOYEE,
    }),
  );
};

export const createTestRoom = async (
  data: Partial<{
    name: string;
    capacity: number;
    floor: number;
    location: string;
    status: RoomStatus;
  }> = {},
): Promise<Room> => {
  const rooms = repo(Room);
  return rooms.save(
    rooms.create({
      name: data.name ?? `Room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      capacity: data.capacity ?? 10,
      floor: data.floor ?? 1,
      location: data.location ?? 'Building A',
      status: data.status ?? RoomStatus.AVAILABLE,
    }),
  );
};

export const createTestEquipment = async (
  name: string,
): Promise<Equipment> => {
  const equipment = repo(Equipment);
  return equipment.save(equipment.create({ name }));
};

export const assignEquipmentToRoom = async (
  roomId: number,
  equipmentId: number,
): Promise<RoomEquipment> => {
  const roomEquipment = repo(RoomEquipment);
  return roomEquipment.save(roomEquipment.create({ roomId, equipmentId }));
};

export const createTestBooking = async (
  data: Partial<{
    roomId: number;
    organizerId: number;
    title: string;
    description: string;
    status: BookingStatus;
    startTime: Date;
    endTime: Date;
    recurrenceId: string;
  }>,
): Promise<Booking> => {
  const bookings = repo(Booking);
  const booking = bookings.create({
    roomId: data.roomId ?? 1,
    organizerId: data.organizerId ?? 1,
    title: data.title ?? 'Test Booking',
    description: data.description ?? '',
    status: data.status ?? BookingStatus.CONFIRMED,
    startTime: data.startTime ?? new Date(Date.now() + 3_600_000),
    endTime: data.endTime ?? new Date(Date.now() + 7_200_000),
  });
  if (data.recurrenceId !== undefined) {
    booking.recurrenceId = data.recurrenceId;
  }
  return bookings.save(booking);
};

export const createTestParticipant = async (
  bookingId: number,
  employeeId: number,
): Promise<Participant> => {
  const participants = repo(Participant);
  return participants.save(participants.create({ bookingId, employeeId }));
};

export const createTestCheckIn = async (
  bookingId: number,
  checkedInBy: number,
  checkedInAt: Date = new Date(),
): Promise<CheckIn> => {
  const checkIns = repo(CheckIn);
  return checkIns.save(
    checkIns.create({ bookingId, checkedInBy, checkedInAt }),
  );
};

export const createTestWaitlistEntry = async (
  data: Partial<{
    roomId: number;
    employeeId: number;
    startTime: Date;
    endTime: Date;
  }>,
): Promise<WaitlistEntry> => {
  const entries = repo(WaitlistEntry);
  return entries.save(
    entries.create({
      roomId: data.roomId ?? 1,
      employeeId: data.employeeId ?? 1,
      startTime: data.startTime ?? new Date(Date.now() + 3_600_000),
      endTime: data.endTime ?? new Date(Date.now() + 7_200_000),
    }),
  );
};

export const createTestMaintenance = async (
  data: Partial<{
    roomId: number;
    startTime: Date;
    endTime: Date;
    reason: string;
  }>,
): Promise<Maintenance> => {
  const maintenances = repo(Maintenance);
  return maintenances.save(
    maintenances.create({
      roomId: data.roomId ?? 1,
      startTime: data.startTime ?? new Date(Date.now() + 3_600_000),
      endTime: data.endTime ?? new Date(Date.now() + 7_200_000),
      reason: data.reason ?? 'Maintenance',
    }),
  );
};

export const createAuthUser = (
  id: number,
  role: UserRole = UserRole.EMPLOYEE,
): AuthUser => ({ id, role });

export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60_000);

export const addHours = (date: Date, hours: number): Date =>
  new Date(date.getTime() + hours * 3_600_000);

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * 86_400_000);

export const startOfNextMinute = (): Date => {
  const now = Date.now();
  return new Date(now + (60_000 - (now % 60_000)));
};

export const startOfNextHour = (): Date => {
  const now = Date.now();
  return new Date(now + (3_600_000 - (now % 3_600_000)));
};
