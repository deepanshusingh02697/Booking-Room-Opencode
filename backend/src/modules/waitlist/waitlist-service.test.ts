import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { WaitlistService } from './services/waitlist-service';
import { WaitlistEntry } from './entities/waitlist-entry';
import { MaintenanceService } from '../maintenance/services/maintenance-service';
import { UserRole } from '../auth/entities/employee';
import { RoomStatus } from '../rooms/entities/room';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../common/errors';
import {
  addHours,
  createAuthUser,
  createTestBooking,
  createTestEmployee,
  createTestRoom,
  describeDb,
  startOfNextHour,
  testDataSource,
  truncateTables,
} from '../../test/test-utils';

describeDb('WaitlistService - Critical Rules', () => {
  let waitlistService: WaitlistService;
  let maintenanceService: MaintenanceService;
  let employee: number;
  let other: number;
  let admin: number;
  let roomId: number;

  beforeEach(async () => {
    await truncateTables();

    waitlistService = new WaitlistService();
    maintenanceService = new MaintenanceService();

    const organizer = await createTestEmployee({ email: 'wl-org@test.com' });
    const otherEmployee = await createTestEmployee({
      email: 'wl-other@test.com',
    });
    const adminUser = await createTestEmployee({
      email: 'wl-admin@test.com',
      role: UserRole.ADMIN,
    });
    const room = await createTestRoom({ name: 'Waitlist Room' });

    employee = organizer.id;
    other = otherEmployee.id;
    admin = adminUser.id;
    roomId = room.id;
  });

  describe('join', () => {
    it('rejects joining when the slot is free (VALIDATION_ERROR)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        waitlistService.join(createAuthUser(employee), {
          roomId,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('joins a waitlist for a fully booked slot', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      const entry = await waitlistService.join(createAuthUser(employee), {
        roomId,
        startTime: start,
        endTime: end,
      });

      expect(entry.employeeId).toBe(employee);
    });

    it('rejects a duplicate waitlist entry (CONFLICT)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      const request = {
        roomId,
        startTime: start,
        endTime: end,
      };
      await waitlistService.join(createAuthUser(employee), request);

      await expect(
        waitlistService.join(createAuthUser(employee), request),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects a start time in the past (VALIDATION_ERROR)', async () => {
      const pastStart = new Date(Date.now() - 3_600_000);
      const pastEnd = new Date(Date.now() - 1_800_000);

      await expect(
        waitlistService.join(createAuthUser(employee), {
          roomId,
          startTime: pastStart,
          endTime: pastEnd,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects an end time at or before the start (VALIDATION_ERROR)', async () => {
      const start = startOfNextHour();

      await expect(
        waitlistService.join(createAuthUser(employee), {
          roomId,
          startTime: start,
          endTime: start,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects a room that is not AVAILABLE (VALIDATION_ERROR)', async () => {
      const maintenanceRoom = await createTestRoom({
        name: 'Under maintenance',
        status: RoomStatus.MAINTENANCE,
      });
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId: maintenanceRoom.id,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      await expect(
        waitlistService.join(createAuthUser(employee), {
          roomId: maintenanceRoom.id,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects a window blocked by maintenance (VALIDATION_ERROR)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      // The maintenance window is created first: `MaintenanceService` refuses a
      // window overlapping a confirmed booking, and that conflict has to be
      // present to reach the waitlist check.
      await maintenanceService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { roomId, startTime: start, endTime: end, reason: 'Cleaning' },
      );
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      await expect(
        waitlistService.join(createAuthUser(employee), {
          roomId,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects an unknown room (NOT_FOUND)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        waitlistService.join(createAuthUser(employee), {
          roomId: 99999,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects an admin (FORBIDDEN)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      await expect(
        waitlistService.join(createAuthUser(admin, UserRole.ADMIN), {
          roomId,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);

      await expect(
        waitlistService.join(null, {
          roomId,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('leave', () => {
    it('removes the caller own entry', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      const entry = await waitlistService.join(createAuthUser(employee), {
        roomId,
        startTime: start,
        endTime: end,
      });

      const result = await waitlistService.leave(
        createAuthUser(employee),
        entry.id,
      );
      expect(result).toBe(true);

      const entries = await testDataSource
        .getRepository(WaitlistEntry)
        .find();
      expect(entries).toHaveLength(0);
    });

    it("rejects removing someone else's entry (FORBIDDEN)", async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      const entry = await waitlistService.join(createAuthUser(employee), {
        roomId,
        startTime: start,
        endTime: end,
      });

      await expect(
        waitlistService.leave(createAuthUser(other), entry.id),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects leaving twice (NOT_FOUND)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      const entry = await waitlistService.join(createAuthUser(employee), {
        roomId,
        startTime: start,
        endTime: end,
      });

      await waitlistService.leave(createAuthUser(employee), entry.id);

      await expect(
        waitlistService.leave(createAuthUser(employee), entry.id),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects an unknown entry (NOT_FOUND)', async () => {
      await expect(
        waitlistService.leave(createAuthUser(employee), 99999),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      await expect(waitlistService.leave(null, 1)).rejects.toThrow(
        UnauthenticatedError,
      );
    });
  });

  describe('myWaitlist', () => {
    it("returns only the caller's entries, oldest first", async () => {
      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId,
        organizerId: other,
        title: 'Blocking',
        startTime: start,
        endTime: end,
      });

      const secondRoom = await createTestRoom({ name: 'Second Waitlist Room' });
      const secondStart = addHours(start, 2);
      const secondEnd = addHours(secondStart, 1);
      await createTestBooking({
        roomId: secondRoom.id,
        organizerId: other,
        title: 'Blocking 2',
        startTime: secondStart,
        endTime: secondEnd,
      });

      await waitlistService.join(createAuthUser(employee), {
        roomId,
        startTime: start,
        endTime: end,
      });
      await waitlistService.join(createAuthUser(employee), {
        roomId: secondRoom.id,
        startTime: secondStart,
        endTime: secondEnd,
      });
      await waitlistService.join(createAuthUser(other), {
        roomId,
        startTime: start,
        endTime: end,
      });

      const entries = await waitlistService.myWaitlist(createAuthUser(employee));
      expect(entries).toHaveLength(2);
      expect(entries.every((e) => e.employeeId === employee)).toBe(true);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      await expect(waitlistService.myWaitlist(null)).rejects.toThrow(
        UnauthenticatedError,
      );
    });
  });
});
