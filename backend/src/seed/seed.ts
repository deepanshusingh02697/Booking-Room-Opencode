import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { Employee, UserRole } from '../modules/auth/entities/employee';
import { Room, RoomStatus } from '../modules/rooms/entities/room';
import { Equipment } from '../modules/equipment/entities/equipment';
import { RoomEquipment } from '../modules/equipment/entities/room-equipment';
import { Booking, BookingStatus } from '../modules/bookings/entities/booking';
import { Participant } from '../modules/participants/entities/participant';
import { CheckIn } from '../modules/checkin/entities/check-in';
import { WaitlistEntry } from '../modules/waitlist/entities/waitlist-entry';
import { Maintenance } from '../modules/maintenance/entities/maintenance';
import { logger } from '../common/logger';

const main = async () => {
  await AppDataSource.initialize();
  logger.info('Connected to the database');

  const employeeRepo = AppDataSource.getRepository(Employee);
  const roomRepo = AppDataSource.getRepository(Room);
  const equipmentRepo = AppDataSource.getRepository(Equipment);
  const roomEquipmentRepo = AppDataSource.getRepository(RoomEquipment);
  const bookingRepo = AppDataSource.getRepository(Booking);
  const participantRepo = AppDataSource.getRepository(Participant);
  const checkInRepo = AppDataSource.getRepository(CheckIn);
  const waitlistRepo = AppDataSource.getRepository(WaitlistEntry);
  const maintenanceRepo = AppDataSource.getRepository(Maintenance);

  const existingCount = await employeeRepo.count();
  if (existingCount > 0) {
    logger.info(`Seed skipped: ${existingCount} employees already exist.`);
    await AppDataSource.destroy();
    return;
  }

  const hashPassword = async (pw: string) => bcrypt.hash(pw, 10);

  const admin = await employeeRepo.save(
    employeeRepo.create({
      firstName: 'Deepanshu',
      lastName: 'Singh',
      email: 'admin@mri.com',
      password: await hashPassword('Admin@123'),
      role: UserRole.ADMIN,
    }),
  );

  const employeePassword = await hashPassword('Employee@123');
  const employees = await employeeRepo.save(
    [
      { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@mri.com' },
      { firstName: 'Priya', lastName: 'Verma', email: 'priya@mri.com' },
      { firstName: 'Rohan', lastName: 'Mehta', email: 'rohan@mri.com' },
      { firstName: 'Sara', lastName: 'Kapoor', email: 'sara@mri.com' },
    ].map((u) => ({
      ...u,
      password: employeePassword,
      role: UserRole.EMPLOYEE,
    })),
  );

  const [aarav, priya, rohan, sara] = employees;

  const rooms = await roomRepo.save([
    roomRepo.create({ name: 'Atlas 2.01', capacity: 10, floor: 2, location: 'North Wing', status: RoomStatus.AVAILABLE }),
    roomRepo.create({ name: 'Orion 1.04', capacity: 12, floor: 1, location: 'East Wing', status: RoomStatus.AVAILABLE }),
    roomRepo.create({ name: 'Vega 3.02', capacity: 8, floor: 3, location: 'West Wing', status: RoomStatus.AVAILABLE }),
    roomRepo.create({ name: 'Nova 2.10', capacity: 20, floor: 2, location: 'North Wing', status: RoomStatus.MAINTENANCE }),
    roomRepo.create({ name: 'Polaris 0.03', capacity: 6, floor: 0, location: 'Lobby', status: RoomStatus.DISABLED }),
  ]);

  const [atlas, orion, vega, nova, polaris] = rooms;

  const equipment = await equipmentRepo.save([
    equipmentRepo.create({ name: 'Display' }),
    equipmentRepo.create({ name: 'Whiteboard' }),
    equipmentRepo.create({ name: 'Video Conference' }),
    equipmentRepo.create({ name: 'Projector' }),
  ]);

  const [display, whiteboard, videoConference, projector] = equipment;

  await roomEquipmentRepo.save([
    roomEquipmentRepo.create({ roomId: atlas.id, equipmentId: display.id }),
    roomEquipmentRepo.create({ roomId: atlas.id, equipmentId: whiteboard.id }),
    roomEquipmentRepo.create({ roomId: atlas.id, equipmentId: videoConference.id }),
    roomEquipmentRepo.create({ roomId: orion.id, equipmentId: display.id }),
    roomEquipmentRepo.create({ roomId: orion.id, equipmentId: projector.id }),
    roomEquipmentRepo.create({ roomId: vega.id, equipmentId: whiteboard.id }),
    roomEquipmentRepo.create({ roomId: nova.id, equipmentId: display.id }),
  ]);

  const today = new Date();
  today.setSeconds(0, 0);
  const at = (hour: number, minute = 0, dayOffset = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const bookings = await bookingRepo.save([
    bookingRepo.create({
      roomId: atlas.id,
      organizerId: aarav.id,
      title: 'Product Sync',
      description: 'Weekly product sync',
      status: BookingStatus.CONFIRMED,
      startTime: at(9, 30),
      endTime: at(10, 30),
    }),
    bookingRepo.create({
      roomId: orion.id,
      organizerId: priya.id,
      title: 'Design Review',
      description: 'Review latest designs',
      status: BookingStatus.CONFIRMED,
      startTime: at(11, 0),
      endTime: at(12, 0),
    }),
    bookingRepo.create({
      roomId: vega.id,
      organizerId: rohan.id,
      title: 'Client Call',
      description: 'Call with the client',
      status: BookingStatus.CONFIRMED,
      startTime: at(14, 0),
      endTime: at(15, 0),
    }),
    bookingRepo.create({
      roomId: atlas.id,
      organizerId: sara.id,
      title: 'Recurring Standup',
      description: 'Daily standup',
      status: BookingStatus.CONFIRMED,
      recurrenceId: 'rc-standup-1',
      startTime: at(9, 0, 1),
      endTime: at(9, 30, 1),
    }),
    bookingRepo.create({
      roomId: atlas.id,
      organizerId: sara.id,
      title: 'Recurring Standup',
      description: 'Daily standup',
      status: BookingStatus.CONFIRMED,
      recurrenceId: 'rc-standup-1',
      startTime: at(9, 0, 2),
      endTime: at(9, 30, 2),
    }),
    bookingRepo.create({
      roomId: atlas.id,
      organizerId: sara.id,
      title: 'Recurring Standup',
      description: 'Daily standup',
      status: BookingStatus.CONFIRMED,
      recurrenceId: 'rc-standup-1',
      startTime: at(9, 0, 3),
      endTime: at(9, 30, 3),
    }),
    bookingRepo.create({
      roomId: vega.id,
      organizerId: priya.id,
      title: 'Past Design Review',
      status: BookingStatus.COMPLETED,
      startTime: at(10, 0, -1),
      endTime: at(11, 0, -1),
    }),
    bookingRepo.create({
      roomId: orion.id,
      organizerId: aarav.id,
      title: 'Cancelled Planning',
      status: BookingStatus.CANCELLED,
      startTime: at(16, 0),
      endTime: at(17, 0),
    }),
    bookingRepo.create({
      roomId: nova.id,
      organizerId: rohan.id,
      title: 'Past No-shows',
      status: BookingStatus.NO_SHOW,
      startTime: at(13, 0, -1),
      endTime: at(14, 0, -1),
    }),
  ]);

  const [productSync, designReview, clientCall, , , , pastDesignReview] = bookings;

  await participantRepo.save([
    participantRepo.create({ bookingId: productSync.id, employeeId: priya.id }),
    participantRepo.create({ bookingId: productSync.id, employeeId: rohan.id }),
    participantRepo.create({ bookingId: designReview.id, employeeId: sara.id }),
    participantRepo.create({ bookingId: clientCall.id, employeeId: aarav.id }),
    participantRepo.create({ bookingId: pastDesignReview.id, employeeId: sara.id }),
    participantRepo.create({ bookingId: pastDesignReview.id, employeeId: rohan.id }),
  ]);

  await checkInRepo.save(
    checkInRepo.create({
      bookingId: pastDesignReview.id,
      checkedInBy: priya.id,
      checkedInAt: at(9, 55, -1),
    }),
  );

  await waitlistRepo.save(
    waitlistRepo.create({
      roomId: atlas.id,
      employeeId: rohan.id,
      startTime: at(9, 30),
      endTime: at(10, 30),
    }),
  );

  await maintenanceRepo.save([
    maintenanceRepo.create({
      roomId: nova.id,
      startTime: at(0, 0, 0),
      endTime: at(8, 0, 1),
      reason: 'AC repair',
    }),
    maintenanceRepo.create({
      roomId: polaris.id,
      startTime: at(0, 0, -5),
      endTime: at(0, 0, 5),
      reason: 'Room disabled - renovation',
    }),
  ]);

  logger.info('Seed data created successfully.');
  await AppDataSource.destroy();
};

main().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});