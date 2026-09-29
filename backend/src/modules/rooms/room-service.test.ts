import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from './services/room-service';
import { EquipmentService } from '../equipment/services/equipment-service';
import { RoomStatus } from './entities/room';
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
  describeDb,
  startOfNextHour,
  truncateTables,
} from '../../test/test-utils';

describeDb('RoomService - Critical Rules', () => {
  let roomService: RoomService;
  let equipmentService: EquipmentService;
  let admin: number;
  let employee: number;

  beforeEach(async () => {
    await truncateTables();

    roomService = new RoomService();
    equipmentService = new EquipmentService();

    const adminUser = await createTestEmployee({
      email: 'room-admin@test.com',
      role: UserRole.ADMIN,
    });
    const plainUser = await createTestEmployee({ email: 'room-emp@test.com' });

    admin = adminUser.id;
    employee = plainUser.id;
  });

  describe('create', () => {
    it('creates a room', async () => {
      const room = await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Atlas',
        capacity: 8,
        floor: 2,
        location: 'Building A',
      });

      expect(room).toBeTruthy();
      expect(room.name).toBe('Atlas');
    });

    it('rejects a duplicate room name (CONFLICT)', async () => {
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Atlas',
        capacity: 8,
        floor: 2,
        location: 'Building A',
      });

      await expect(
        roomService.create(createAuthUser(admin, UserRole.ADMIN), {
          name: 'Atlas',
          capacity: 6,
          floor: 1,
          location: 'Building B',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('rejects a non-admin (FORBIDDEN)', async () => {
      await expect(
        roomService.create(createAuthUser(employee), {
          name: 'Atlas',
          capacity: 8,
          floor: 2,
          location: 'Building A',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      await expect(
        roomService.create(null, {
          name: 'Atlas',
          capacity: 8,
          floor: 2,
          location: 'Building A',
        }),
      ).rejects.toThrow(UnauthenticatedError);
    });

    it('rejects a blank name (VALIDATION_ERROR)', async () => {
      await expect(
        roomService.create(createAuthUser(admin, UserRole.ADMIN), {
          name: '   ',
          capacity: 8,
          floor: 2,
          location: 'Building A',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('search', () => {
    it('filters by status', async () => {
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Available Room',
        capacity: 8,
        floor: 2,
        location: 'A',
      });
      const maintenanceRoom = await roomService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { name: 'Maint Room', capacity: 6, floor: 1, location: 'B' },
      );
      await roomService.setStatus(
        createAuthUser(admin, UserRole.ADMIN),
        maintenanceRoom.id,
        RoomStatus.MAINTENANCE,
      );

      const available = await roomService.search(createAuthUser(employee), {
        status: RoomStatus.AVAILABLE,
      });
      expect(available.map((r) => r.name)).toEqual(['Available Room']);
    });

    it('filters by minimum capacity', async () => {
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Small',
        capacity: 4,
        floor: 1,
        location: 'A',
      });
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Large',
        capacity: 12,
        floor: 2,
        location: 'B',
      });

      const large = await roomService.search(createAuthUser(employee), {
        minCapacity: 10,
      });
      expect(large.map((r) => r.name)).toEqual(['Large']);
    });

    it('filters by floor', async () => {
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Floor 1',
        capacity: 8,
        floor: 1,
        location: 'A',
      });
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Floor 2',
        capacity: 8,
        floor: 2,
        location: 'B',
      });

      const floor2 = await roomService.search(createAuthUser(employee), {
        floor: 2,
      });
      expect(floor2.map((r) => r.name)).toEqual(['Floor 2']);
    });

    it('requires every requested equipment (AND semantics)', async () => {
      const projector = await equipmentService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { name: 'Projector' },
      );
      const whiteboard = await equipmentService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { name: 'Whiteboard' },
      );

      const both = await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Both',
        capacity: 8,
        floor: 1,
        location: 'A',
      });
      const onlyProjector = await roomService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { name: 'Only Projector', capacity: 8, floor: 1, location: 'A' },
      );

      await equipmentService.assignToRoom(
        createAuthUser(admin, UserRole.ADMIN),
        both.id,
        projector.id,
      );
      await equipmentService.assignToRoom(
        createAuthUser(admin, UserRole.ADMIN),
        both.id,
        whiteboard.id,
      );
      await equipmentService.assignToRoom(
        createAuthUser(admin, UserRole.ADMIN),
        onlyProjector.id,
        projector.id,
      );

      const matched = await roomService.search(createAuthUser(employee), {
        equipmentIds: [projector.id, whiteboard.id],
      });
      expect(matched.map((r) => r.id)).toEqual([both.id]);
    });

    it('excludes rooms with an overlapping booking when a window is given', async () => {
      const busy = await roomService.create(
        createAuthUser(admin, UserRole.ADMIN),
        { name: 'Busy Room', capacity: 8, floor: 1, location: 'A' },
      );
      await roomService.create(createAuthUser(admin, UserRole.ADMIN), {
        name: 'Free Room',
        capacity: 8,
        floor: 1,
        location: 'A',
      });

      const start = startOfNextHour();
      const end = addHours(start, 1);
      await createTestBooking({
        roomId: busy.id,
        organizerId: employee,
        title: 'Booking',
        startTime: start,
        endTime: end,
      });

      const available = await roomService.search(createAuthUser(employee), {
        startTime: start,
        endTime: end,
      });
      expect(available.map((r) => r.id)).not.toContain(busy.id);
    });

    it('rejects a time window with only one bound (VALIDATION_ERROR)', async () => {
      await expect(
        roomService.search(createAuthUser(employee), { startTime: new Date() }),
      ).rejects.toThrow(ValidationError);
    });

    it('rejects unauthenticated (UNAUTHENTICATED)', async () => {
      await expect(roomService.search(null)).rejects.toThrow(
        UnauthenticatedError,
      );
    });
  });

  describe('getById', () => {
    it('rejects an unknown room (NOT_FOUND)', async () => {
      await expect(
        roomService.getById(createAuthUser(employee), 99999),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
