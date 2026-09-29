import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { CheckInService } from './services/check-in-service';
import { Booking, BookingStatus } from '../bookings/entities/booking';
import { UserRole } from '../auth/entities/employee';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../common/errors';
import {
  addHours,
  addMinutes,
  createAuthUser,
  createTestBooking,
  createTestCheckIn,
  createTestEmployee,
  createTestParticipant,
  createTestRoom,
  describeDb,
  testDataSource,
  truncateTables,
} from '../../test/test-utils';

describeDb('CheckInService - Critical Rules', () => {
  let checkInService: CheckInService;

  beforeEach(async () => {
    await truncateTables(testDataSource);
    checkInService = new CheckInService();
  });

  describe('checkIn', () => {
    it('allows organizer to check in', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      // The check-in window is [startTime, startTime + 10 min).
      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Check In Test',
        startTime: start,
        endTime: addHours(start, 1),
      });

      const confirmed = await checkInService.checkIn(
        createAuthUser(organizer.id),
        booking.id,
      );
      expect(confirmed.status).toBe(BookingStatus.CONFIRMED);

      const checkIn = await checkInService.getForBooking(
        createAuthUser(organizer.id),
        booking.id,
      );
      expect(checkIn).toBeTruthy();
      expect(checkIn?.checkedInBy).toBe(organizer.id);
    });

    it('allows listed participant to check in', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const participant = await createTestEmployee({ email: 'ci-p1@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Participant Check In',
        startTime: start,
        endTime: addHours(start, 1),
      });
      await createTestParticipant(booking.id, participant.id);

      await checkInService.checkIn(createAuthUser(participant.id), booking.id);

      const checkIn = await checkInService.getForBooking(
        createAuthUser(participant.id),
        booking.id,
      );
      expect(checkIn).toBeTruthy();
      expect(checkIn?.checkedInBy).toBe(participant.id);
    });

    it('rejects uninvolved employee (FORBIDDEN)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const outsider = await createTestEmployee({ email: 'ci-outsider@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Uninvolved',
        startTime: start,
        endTime: addHours(start, 1),
      });

      await expect(
        checkInService.checkIn(createAuthUser(outsider.id), booking.id),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects admin who is neither organizer nor participant (FORBIDDEN)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const admin = await createTestEmployee({
        email: 'ci-admin@test.com',
        role: UserRole.ADMIN,
      });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Admin Forbidden',
        startTime: start,
        endTime: addHours(start, 1),
      });

      await expect(
        checkInService.checkIn(createAuthUser(admin.id, UserRole.ADMIN), booking.id),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects duplicate check-in (CONFLICT)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Duplicate Check In',
        startTime: start,
        endTime: addHours(start, 1),
      });

      await checkInService.checkIn(createAuthUser(organizer.id), booking.id);

      await expect(
        checkInService.checkIn(createAuthUser(organizer.id), booking.id),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects check-in before the window opens (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), 30);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Too Early',
        startTime: start,
        endTime: addHours(start, 1),
      });

      await expect(
        checkInService.checkIn(createAuthUser(organizer.id), booking.id),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects check-in after the window closes (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), -15);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Too Late',
        startTime: start,
        endTime: addHours(start, 1),
      });

      await expect(
        checkInService.checkIn(createAuthUser(organizer.id), booking.id),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects unknown booking (NOT_FOUND)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });

      await expect(
        checkInService.checkIn(createAuthUser(organizer.id), 99999),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects a cancelled booking (VALIDATION_ERROR)', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'CheckIn Room' });

      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Cancelled',
        startTime: start,
        endTime: addHours(start, 1),
        status: BookingStatus.CANCELLED,
      });

      await expect(
        checkInService.checkIn(createAuthUser(organizer.id), booking.id),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      await expect(checkInService.checkIn(null, 1)).rejects.toThrow(
        UnauthenticatedError,
      );
    });
  });

  describe('no-show release', () => {
    it('releases a room when nobody checks in within 10 minutes', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'No Show Room' });

      const start = addMinutes(new Date(), -15);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'No Show',
        startTime: start,
        endTime: addHours(start, 1),
        status: BookingStatus.CONFIRMED,
      });

      const released = await checkInService.releaseNoShows(new Date());
      expect(released.map((b) => b.id)).toContain(booking.id);

      const updated = await testDataSource
        .getRepository(Booking)
        .findOneBy({ id: booking.id });
      expect(updated?.status).toBe(BookingStatus.NO_SHOW);
    });

    it('does not release a room that was checked into', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'Checked In Room' });

      const start = addMinutes(new Date(), -15);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'Checked In',
        startTime: start,
        endTime: addHours(start, 1),
        status: BookingStatus.CONFIRMED,
      });
      await createTestCheckIn(booking.id, organizer.id, start);

      await checkInService.releaseNoShows(new Date());

      const updated = await testDataSource
        .getRepository(Booking)
        .findOneBy({ id: booking.id });
      expect(updated?.status).toBe(BookingStatus.CONFIRMED);
    });

    it('leaves a booking inside its check-in window alone', async () => {
      const organizer = await createTestEmployee({ email: 'ci-org@test.com' });
      const room = await createTestRoom({ name: 'In Window Room' });

      const start = addMinutes(new Date(), -5);
      const booking = await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'In Window',
        startTime: start,
        endTime: addHours(start, 1),
        status: BookingStatus.CONFIRMED,
      });

      const released = await checkInService.releaseNoShows(new Date());
      expect(released.map((b) => b.id)).not.toContain(booking.id);
    });
  });
});
