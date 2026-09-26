import { AuthUser } from '../../../common/context';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../../common/errors';
import { AppDataSource } from '../../../config/data-source';
import { UserRole } from '../../auth/entities/employee';
import { BookingRepository } from '../../bookings/repositories/booking-repository';
import { Maintenance } from '../../maintenance/entities/maintenance';
import { Room, RoomStatus } from '../../rooms/entities/room';
import { RoomRepository } from '../../rooms/repositories/room-repository';
import { WaitlistEntry } from '../entities/waitlist-entry';
import { WaitlistRepository } from '../repositories/waitlist-repository';

export interface JoinWaitlistData {
  roomId: number;
  startTime: Date;
  endTime: Date;
}

const WAITLIST_DUPLICATE_PG_CODE = '23505';

const isWaitlistDuplicateViolation = (error: unknown): boolean => {
  const candidate = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return (
    (candidate.code ?? candidate.driverError?.code) ===
    WAITLIST_DUPLICATE_PG_CODE
  );
};

export class WaitlistService {
  private readonly waitlistRepository = new WaitlistRepository();
  private readonly roomRepository = new RoomRepository();
  private readonly bookingRepository = new BookingRepository();

  async join(user: AuthUser | null, data: JoinWaitlistData): Promise<WaitlistEntry> {
    this.requireRole(user, UserRole.EMPLOYEE);

    if (data.startTime >= data.endTime) {
      throw new ValidationError(
        'Waitlist start time must be before end time.',
      );
    }

    if (data.startTime.getTime() <= Date.now()) {
      throw new ValidationError('Waitlist start time cannot be in the past.');
    }

    const room = await this.roomRepository.findById(data.roomId);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    if (room.status !== RoomStatus.AVAILABLE) {
      throw new ValidationError(
        `Room "${room.name}" is not available for waitlisting (current status: ${room.status}).`,
      );
    }

    const conflictingMaintenance =
      await this.bookingRepository.findConflictingMaintenance(
        AppDataSource.manager,
        room.id,
        data.startTime,
        data.endTime,
      );
    if (conflictingMaintenance) {
      throw new ValidationError(
        this.buildMaintenanceBlockedMessage(room, conflictingMaintenance),
      );
    }

    const conflictingBooking =
      await this.bookingRepository.findConflictingBooking(
        AppDataSource.manager,
        room.id,
        data.startTime,
        data.endTime,
      );
    if (!conflictingBooking) {
      throw new ValidationError(
        `Room "${room.name}" is available for the requested time. Book it directly instead of joining the waitlist.`,
      );
    }

    const existingEntry =
      await this.waitlistRepository.findOverlappingForEmployee(
        room.id,
        user.id,
        data.startTime,
        data.endTime,
      );
    if (existingEntry) {
      throw new ConflictError(
        `You have already joined the waitlist for an overlapping time window in "${room.name}".`,
      );
    }

    try {
      return await this.waitlistRepository.create({
        roomId: room.id,
        employeeId: user.id,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    } catch (error) {
      if (!isWaitlistDuplicateViolation(error)) {
        throw error;
      }
      throw new ConflictError(
        `You have already joined the waitlist for this room and time window.`,
      );
    }
  }

  async leave(user: AuthUser | null, entryId: number): Promise<boolean> {
    this.requireAuthenticated(user);

    const entry = await this.waitlistRepository.findById(entryId);
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found.');
    }

    if (entry.employeeId !== user.id) {
      throw new ForbiddenError();
    }

    const removed = await this.waitlistRepository.deleteById(entry.id);
    if (!removed) {
      throw new ConflictError('Waitlist entry could not be removed.');
    }

    return true;
  }

  async myWaitlist(user: AuthUser | null): Promise<WaitlistEntry[]> {
    this.requireAuthenticated(user);
    return this.waitlistRepository.findByEmployee(user.id);
  }

  private buildMaintenanceBlockedMessage(
    room: Room,
    maintenance: Maintenance,
  ): string {
    const reason = maintenance.reason ? ` (${maintenance.reason})` : '';
    return `Room "${room.name}" is under maintenance during the requested time (${maintenance.startTime.toISOString()} to ${maintenance.endTime.toISOString()}${reason}), so it cannot be added to the waitlist.`;
  }

  private requireAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthenticatedError();
    }
  }

  private requireRole(
    user: AuthUser | null,
    role: UserRole,
  ): asserts user is AuthUser {
    this.requireAuthenticated(user);
    if (user.role !== role) {
      throw new ForbiddenError();
    }
  }
}
