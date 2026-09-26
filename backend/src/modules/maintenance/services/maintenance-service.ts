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
import { Booking } from '../../bookings/entities/booking';
import { BookingRepository } from '../../bookings/repositories/booking-repository';
import { Maintenance } from '../entities/maintenance';
import {
  MaintenanceRepository,
  NewMaintenanceData,
} from '../repositories/maintenance-repository';
import { Room } from '../../rooms/entities/room';
import { RoomRepository } from '../../rooms/repositories/room-repository';

export interface CreateMaintenanceData {
  roomId: number;
  startTime: Date;
  endTime: Date;
  reason?: string;
}

const SERIALIZABLE_RETRY_ATTEMPTS = 3;
const RETRYABLE_PG_CODES = new Set(['40001', '40P01']);

const isRetryableTransactionError = (error: unknown): boolean => {
  const candidate = error as {
    code?: string;
    driverError?: { code?: string };
    message?: string;
  };
  const code = candidate.code ?? candidate.driverError?.code;
  if (code && RETRYABLE_PG_CODES.has(code)) {
    return true;
  }
  const message = candidate.message ?? '';
  return (
    message.includes('could not serialize') ||
    message.includes('deadlock detected')
  );
};

export class MaintenanceService {
  private readonly maintenanceRepository = new MaintenanceRepository();
  private readonly roomRepository = new RoomRepository();
  private readonly bookingRepository = new BookingRepository();

  async create(
    user: AuthUser | null,
    data: CreateMaintenanceData,
  ): Promise<Maintenance> {
    this.requireRole(user, UserRole.ADMIN);

    let reason: string | undefined;
    if (data.reason !== undefined) {
      const trimmed = data.reason.trim();
      if (trimmed.length === 0) {
        throw new ValidationError('Maintenance reason cannot be empty.');
      }
      reason = trimmed;
    }

    if (data.startTime >= data.endTime) {
      throw new ValidationError(
        'Maintenance start time must be before end time.',
      );
    }

    const room = await this.roomRepository.findById(data.roomId);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    const maintenanceData: NewMaintenanceData = {
      roomId: room.id,
      startTime: data.startTime,
      endTime: data.endTime,
      reason,
    };

    return this.withSerializableRetry(() =>
      this.createInTransaction(maintenanceData, room),
    );
  }

  async delete(user: AuthUser | null, id: number): Promise<boolean> {
    this.requireRole(user, UserRole.ADMIN);

    const maintenance = await this.maintenanceRepository.findById(id);
    if (!maintenance) {
      throw new NotFoundError('Maintenance record not found.');
    }

    const removed = await this.maintenanceRepository.deleteById(
      maintenance.id,
    );
    if (!removed) {
      throw new ConflictError('Maintenance record could not be deleted.');
    }

    return true;
  }

  async roomMaintenance(
    user: AuthUser | null,
    roomId: number,
  ): Promise<Maintenance[]> {
    this.requireAuthenticated(user);

    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    return this.maintenanceRepository.findForRoom(room.id);
  }

  private async createInTransaction(
    maintenanceData: NewMaintenanceData,
    room: Room,
  ): Promise<Maintenance> {
    return AppDataSource.transaction('SERIALIZABLE', async (manager) => {
      const conflictingBooking =
        await this.bookingRepository.findConflictingBooking(
          manager,
          maintenanceData.roomId,
          maintenanceData.startTime,
          maintenanceData.endTime,
        );
      if (conflictingBooking) {
        throw new ConflictError(
          this.buildBookingConflictMessage(room, conflictingBooking),
        );
      }

      const conflictingMaintenance =
        await this.bookingRepository.findConflictingMaintenance(
          manager,
          maintenanceData.roomId,
          maintenanceData.startTime,
          maintenanceData.endTime,
        );
      if (conflictingMaintenance) {
        const reason = conflictingMaintenance.reason
          ? ` (${conflictingMaintenance.reason})`
          : '';
        throw new ConflictError(
          `Room "${room.name}" is already under maintenance during the requested time (${conflictingMaintenance.startTime.toISOString()} to ${conflictingMaintenance.endTime.toISOString()}${reason}).`,
        );
      }

      return this.maintenanceRepository.create(manager, maintenanceData);
    });
  }

  private buildBookingConflictMessage(
    room: Room,
    conflictingBooking: Booking,
  ): string {
    return `Room "${room.name}" is already booked for the requested time (conflicts with "${conflictingBooking.title}", ${conflictingBooking.startTime.toISOString()} to ${conflictingBooking.endTime.toISOString()}).`;
  }

  private async withSerializableRetry<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (!isRetryableTransactionError(error)) {
          throw error;
        }
        if (attempt >= SERIALIZABLE_RETRY_ATTEMPTS) {
          throw new ConflictError(
            'The room schedule was updated while the maintenance window was being saved. Please try again.',
          );
        }
        await this.delay(attempt * 50);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private requireAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthenticatedError();
    }
  }

  private requireRole(user: AuthUser | null, role: UserRole): void {
    this.requireAuthenticated(user);
    if (user.role !== role) {
      throw new ForbiddenError();
    }
  }
}
