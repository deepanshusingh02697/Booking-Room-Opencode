import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { MaintenanceService } from './services/maintenance-service';
import { Maintenance } from './entities/maintenance';
import { BookingStatus } from '../bookings/entities/booking';
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
  createAuthUser,
  createTestBooking,
  createTestEmployee,
  createTestMaintenance,
  createTestRoom,
  describeDb,
  startOfNextHour,
  testDataSource,
  truncateTables,
} from '../../test/test-utils';

describeDb('MaintenanceService - Critical Rules', () => {
  let maintenanceService: MaintenanceService;
  let employee: number;
  let admin: number;
  let roomId: number;

  beforeEach(async () => {
    await truncateTables(testDataSource);

    maintenanceService = new MaintenanceService();

    const organizer = await createTestEmployee({ email: 'maint-org@test.com' });
    const adminUser = await createTestEmployee({
      email: 'maint-admin@test.com',
      role: UserRole.ADMIN,
    });
    const room = await createTestRoom({ name: 'Maintenance Room' });

    employee = organizer.id;
    admin = adminUser.id;
    roomId = room.id;
  });

  describe('create', () => {
    it('creates a maintenance window', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      const maintenance = await maintenanceService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { roomId, startTime: start, endTime: end, reason: 'Cleaning' },
      );

      expect(maintenance).toBeTruthy();
      expect(maintenance.reason).toBe('Cleaning');
    });

    it('rejects an overlap with a confirmed booking (CONFLICT)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      await createTestBooking({
        roomId,
        organizerId: employee,
        title: 'Booking',
        startTime: start,
        endTime: end,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        maintenanceService.create(
          createAuthUser(admin, UserRole.ADMIN),
          { roomId, startTime: start, endTime: end },
        ),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects an overlap with another maintenance window (CONFLICT)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      await createTestMaintenance({ roomId, startTime: start, endTime: end });

      await expect(
        maintenanceService.create(
          createAuthUser(admin, UserRole.ADMIN),
          { roomId, startTime: start, endTime: end },
        ),
      ).rejects.toThrow(ConflictError);
    });

    it('allows adjacency (end === start of the existing window)', async () => {
      const start1 = startOfNextHour();
      const end1 = addHours(start1, 2);
      const start2 = end1;
      const end2 = addHours(start2, 2);

      await createTestMaintenance({ roomId, startTime: start1, endTime: end1 });

      const maintenance = await maintenanceService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { roomId, startTime: start2, endTime: end2 },
      );

      expect(maintenance).toBeTruthy();
    });

    it('allows a window that already started', async () => {
      const pastStart = new Date(Date.now() - 7_200_000);
      const pastEnd = new Date(Date.now() - 3_600_000);

      const maintenance = await maintenanceService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { roomId, startTime: pastStart, endTime: pastEnd },
      );

      expect(maintenance).toBeTruthy();
    });

    it('rejects a non-admin (FORBIDDEN)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      await expect(
        maintenanceService.create(createAuthUser(employee), {
          roomId,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      await expect(
        maintenanceService.create(null, {
          roomId,
          startTime: start,
          endTime: end,
        }),
      ).rejects.toThrow(UnauthenticatedError);
    });

    it('rejects an empty reason (VALIDATION_ERROR)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      await expect(
        maintenanceService.create(
          createAuthUser(admin, UserRole.ADMIN),
          { roomId, startTime: start, endTime: end, reason: '   ' },
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects an unknown room (NOT_FOUND)', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      await expect(
        maintenanceService.create(
          createAuthUser(admin, UserRole.ADMIN),
          { roomId: 99999, startTime: start, endTime: end },
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deletes a maintenance window', async () => {
      const start = startOfNextHour();
      const end = addHours(start, 2);

      const maintenance = await createTestMaintenance({
        roomId,
        startTime: start,
        endTime: end,
      });

      const result = await maintenanceService.delete(
        createAuthUser(admin, UserRole.ADMIN),
        maintenance.id,
      );
      expect(result).toBe(true);

      const found = await testDataSource
        .getRepository(Maintenance)
        .findOneBy({ id: maintenance.id });
      expect(found).toBeNull();
    });

    it('rejects a non-admin (FORBIDDEN)', async () => {
      const maintenance = await createTestMaintenance({ roomId });

      await expect(
        maintenanceService.delete(
          createAuthUser(employee),
          maintenance.id,
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects deleting an already deleted window (NOT_FOUND)', async () => {
      const maintenance = await createTestMaintenance({ roomId });

      await maintenanceService.delete(
        createAuthUser(admin, UserRole.ADMIN),
        maintenance.id,
      );

      await expect(
        maintenanceService.delete(
          createAuthUser(admin, UserRole.ADMIN),
          maintenance.id,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('roomMaintenance', () => {
    it('returns a room maintenance windows in chronological order', async () => {
      const later = startOfNextHour();
      const earlier = new Date(later.getTime() - 7_200_000);

      await createTestMaintenance({
        roomId,
        startTime: later,
        endTime: addHours(later, 2),
      });
      await createTestMaintenance({
        roomId,
        startTime: earlier,
        endTime: addHours(earlier, 1),
      });

      const windows = await maintenanceService.roomMaintenance(
        createAuthUser(employee),
        roomId,
      );

      expect(windows).toHaveLength(2);
      expect(windows[0].startTime.getTime()).toBeLessThan(
        windows[1].startTime.getTime(),
      );
    });

    it('rejects an unknown room (NOT_FOUND)', async () => {
      await expect(
        maintenanceService.roomMaintenance(createAuthUser(employee), 99999),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
