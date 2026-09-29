import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { BookingRepository } from './repositories/booking-repository';
import {
  addDays,
  addHours,
  addMinutes,
  createAuthUser,
  createTestBooking,
  createTestCheckIn,
  createTestEmployee,
  createTestRoom,
  createTestWaitlistEntry,
  describeDb,
  testDataSource,
  truncateTables,
  startOfNextHour,
} from '../../test/test-utils';
import { BookingService } from './services/booking-service';
import { ParticipantRepository } from '../participants/repositories/participant-repository';
import { Booking, BookingStatus } from './entities/booking';
import { RoomStatus } from '../rooms/entities/room';
import { WaitlistEntry } from '../waitlist/entities/waitlist-entry';
import { UserRole } from '../auth/entities/employee';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../common/errors';
import { RecurrenceFrequency } from './utils/recurrence';

describeDb('BookingService - Critical Rules', () => {
  let bookingService: BookingService;
  let participantRepo: ParticipantRepository;

  beforeEach(async () => {
    await truncateTables(testDataSource);

    bookingService = new BookingService();
    participantRepo = new ParticipantRepository();
  });

  describe('createBooking - validation', () => {
    it('rejects overlapping booking (CONFLICT)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const participant = await createTestEmployee({ email: 'p1@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01', capacity: 8 });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'First Booking',
        startTime: start,
        endTime: end,
        participantIds: [participant.id],
      });

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Overlapping Booking',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('blocks concurrent double-booking (exactly one winner)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const other = await createTestEmployee({ email: 'p1@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01', capacity: 8 });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      const results = await Promise.allSettled([
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'A',
          startTime: start,
          endTime: end,
        }),
        bookingService.create(createAuthUser(other.id), {
          roomId: room.id,
          title: 'B',
          startTime: start,
          endTime: end,
        }),
      ]);

      const fulfilled = results.filter(
        (result): result is PromiseFulfilledResult<Booking> =>
          result.status === 'fulfilled',
      );
      const rejected = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictError);
    });

    it('rejects past booking (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const pastStart = new Date(Date.now() - 3_600_000);
      const pastEnd = new Date(Date.now() - 1_800_000);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Past Booking',
          startTime: pastStart,
          endTime: pastEnd,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects invalid time range (start >= end)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Invalid Range',
          startTime: start,
          endTime: start,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects capacity exceeded (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const p1 = await createTestEmployee({ email: 'p1@test.com' });
      const p2 = await createTestEmployee({ email: 'p2@test.com' });
      const smallRoom = await createTestRoom({ name: 'Tiny', capacity: 2 });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: smallRoom.id,
          title: 'Over Capacity',
          startTime: start,
          endTime: end,
          participantIds: [p1.id, p2.id],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects a room under maintenance (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const maintenanceRoom = await createTestRoom({
        name: 'Maintenance Room',
        status: RoomStatus.MAINTENANCE,
      });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: maintenanceRoom.id,
          title: 'Maintenance Booking',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects a disabled room (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const disabledRoom = await createTestRoom({
        name: 'Disabled Room',
        status: RoomStatus.DISABLED,
      });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: disabledRoom.id,
          title: 'Disabled Booking',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects duplicate participant IDs', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const p1 = await createTestEmployee({ email: 'p1@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Dup Participants',
          startTime: start,
          endTime: end,
          participantIds: [p1.id, p1.id],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects organizer as participant', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Organizer as Participant',
          startTime: start,
          endTime: end,
          participantIds: [organizer.id],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects unknown participant (NOT_FOUND)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Unknown Participant',
          startTime: start,
          endTime: end,
          participantIds: [99999],
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects unknown room (NOT_FOUND)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: 99999,
          title: 'Unknown Room',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects empty title (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: '   ',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects admin creating booking (FORBIDDEN)', async () => {
      const admin = await createTestEmployee({
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(createAuthUser(admin.id, UserRole.ADMIN), {
          roomId: room.id,
          title: 'Admin Booking',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        bookingService.create(null, {
          roomId: room.id,
          title: 'Unauth',
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('cancelBooking', () => {
    it('rejects cancelling another users booking (FORBIDDEN)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const other = await createTestEmployee({ email: 'p1@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'To Cancel',
        startTime: start,
        endTime: end,
      });

      await expect(
        bookingService.cancel(createAuthUser(other.id), booking.id),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows admin to cancel another users booking', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const admin = await createTestEmployee({
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = addHours(startOfNextHour(), 2);
      const end = addHours(start, 1);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Admin Cancel',
        startTime: start,
        endTime: end,
      });

      const cancelled = await bookingService.cancel(
        createAuthUser(admin.id, UserRole.ADMIN),
        booking.id,
      );
      expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    });

    it('rejects cancelling inside 30-min window (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const soon = addMinutes(new Date(), 15);
      const later = addMinutes(soon, 60);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Soon Booking',
        startTime: soon,
        endTime: later,
      });

      await expect(
        bookingService.cancel(createAuthUser(organizer.id), booking.id),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects cancelling non-confirmed booking (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Cancelled Booking',
        startTime: start,
        endTime: end,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        bookingService.cancel(createAuthUser(organizer.id), booking.id),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('add/remove participants', () => {
    it('rejects adding participants inside 30-min window', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const p2 = await createTestEmployee({ email: 'p2@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const soon = addMinutes(new Date(), 15);
      const later = addMinutes(soon, 60);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Soon Booking',
        startTime: soon,
        endTime: later,
      });

      await expect(
        bookingService.addParticipants(createAuthUser(organizer.id), {
          bookingId: booking.id,
          employeeIds: [p2.id],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects adding existing participant (CONFLICT)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const p1 = await createTestEmployee({ email: 'p1@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = addHours(startOfNextHour(), 2);
      const end = addHours(start, 1);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Add Participant',
        startTime: start,
        endTime: end,
        participantIds: [p1.id],
      });

      await expect(
        bookingService.addParticipants(createAuthUser(organizer.id), {
          bookingId: booking.id,
          employeeIds: [p1.id],
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects removing participant by non-organizer/non-admin/non-self (FORBIDDEN)', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const p1 = await createTestEmployee({ email: 'p1@test.com' });
      const p2 = await createTestEmployee({ email: 'p2@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Remove Test',
        startTime: start,
        endTime: end,
        participantIds: [p1.id],
      });

      await expect(
        bookingService.removeParticipant(createAuthUser(p2.id), {
          bookingId: booking.id,
          employeeId: p1.id,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows participant to remove themselves', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const p1 = await createTestEmployee({ email: 'p1@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = addHours(startOfNextHour(), 2);
      const end = addHours(start, 1);

      const booking = await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Self Remove',
        startTime: start,
        endTime: end,
        participantIds: [p1.id],
      });

      const result = await bookingService.removeParticipant(
        createAuthUser(p1.id),
        {
          bookingId: booking.id,
          employeeId: p1.id,
        },
      );

      const participants = await participantRepo.listForBooking(result.id);
      expect(participants).toHaveLength(0);
    });
  });

  describe('recurring bookings', () => {
    it('rejects recurring series with conflict across occurrences', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const base = addHours(startOfNextHour(), 2);

      // Blocks the third occurrence of the series below (day 2 of the series).
      await bookingService.create(createAuthUser(organizer.id), {
        roomId: room.id,
        title: 'Existing Booking',
        startTime: addDays(base, 2),
        endTime: addHours(addDays(base, 2), 1),
      });

      const seriesStart = addDays(base, 1);
      const seriesEnd = addHours(seriesStart, 1);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Recurring Conflict',
          startTime: seriesStart,
          endTime: seriesEnd,
          recurrence: {
            frequency: RecurrenceFrequency.DAILY,
            endDate: addDays(seriesStart, 2),
          },
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects recurring series exceeding 90 occurrences', async () => {
      const organizer = await createTestEmployee({ email: 'organizer@test.com' });
      const room = await createTestRoom({ name: 'Atlas 2.01' });

      const start = startOfNextHour();
      const end = addHours(start, 1);
      const until = addDays(start, 100);

      await expect(
        bookingService.create(createAuthUser(organizer.id), {
          roomId: room.id,
          title: 'Too Many Occurrences',
          startTime: start,
          endTime: end,
          recurrence: {
            frequency: RecurrenceFrequency.DAILY,
            endDate: until,
          },
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('booking-completion job', () => {
    it('completes an ended booking that checked in', async () => {
      const organizer = await createTestEmployee({ email: 'ns-org@test.com' });
      const room = await createTestRoom({ name: 'NoShow Room' });

      const pastStart = new Date(Date.now() - 90 * 60_000);
      const pastEnd = new Date(Date.now() - 30 * 60_000);

      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Checked In Booking',
        startTime: pastStart,
        endTime: pastEnd,
        status: BookingStatus.CONFIRMED,
      });
      await createTestCheckIn(booking.id, organizer.id, pastStart);

      await bookingService.completeFinishedBookings(new Date());

      const updated = await new BookingRepository().findById(booking.id);
      expect(updated?.status).toBe(BookingStatus.COMPLETED);
    });

    it('leaves an ended booking without a check-in to the no-show job', async () => {
      const organizer = await createTestEmployee({ email: 'ns-org@test.com' });
      const room = await createTestRoom({ name: 'NoShow Room' });

      const pastStart = new Date(Date.now() - 90 * 60_000);
      const pastEnd = new Date(Date.now() - 30 * 60_000);

      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'No Show Booking',
        startTime: pastStart,
        endTime: pastEnd,
        status: BookingStatus.CONFIRMED,
      });

      const completed = await bookingService.completeFinishedBookings(new Date());
      expect(completed).toHaveLength(0);

      const untouched = await new BookingRepository().findById(booking.id);
      expect(untouched?.status).toBe(BookingStatus.CONFIRMED);
    });
  });
});

describeDb('BookingService - unauthenticated access', () => {
  it('rejects an unauthenticated create', async () => {
    const bookingService = new BookingService();
    const start = startOfNextHour();
    const end = addHours(start, 1);

    await expect(
      bookingService.create(null, {
        roomId: 1,
        title: 'Unauth',
        startTime: start,
        endTime: end,
      }),
    ).rejects.toThrow(UnauthenticatedError);
  });
});

describeDb('Waitlist conversion on cancellation', () => {
  it('converts the first waiter when a booking is cancelled', async () => {
    const bookingService = new BookingService();

    const organizer = await createTestEmployee({ email: 'wl-org@test.com' });
    const waiter = await createTestEmployee({ email: 'waiter@test.com' });
    const room = await createTestRoom({ name: 'Waitlist Room' });

    const start = addHours(startOfNextHour(), 2);
    const end = addHours(start, 1);

    const booking = await bookingService.create(createAuthUser(organizer.id), {
      roomId: room.id,
      title: 'Blocking Booking',
      startTime: start,
      endTime: end,
    });

    await createTestWaitlistEntry({
      roomId: room.id,
      employeeId: waiter.id,
      startTime: start,
      endTime: end,
    });

    await bookingService.cancel(createAuthUser(organizer.id), booking.id);

    const waitlist = await testDataSource
      .getRepository(WaitlistEntry)
      .find();
    expect(waitlist).toHaveLength(0);

    const converted = await new BookingRepository().findById(booking.id);
    expect(converted?.status).toBe(BookingStatus.CANCELLED);

    const bookings = await testDataSource.getRepository(Booking).find();
    const convertedBooking = bookings.find((b) => b.organizerId === waiter.id);
    expect(convertedBooking).toBeTruthy();
    expect(convertedBooking?.title).toContain('Waitlisted');
  });
});
