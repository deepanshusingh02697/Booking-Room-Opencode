import { AuthUser } from '../../../common/context';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../../common/errors';
import { AppDataSource } from '../../../config/data-source';
import { EntityManager } from 'typeorm';
import { EmployeeRepository } from '../../auth/repositories/employee-repository';
import { Booking, BookingStatus } from '../../bookings/entities/booking';
import { BookingRepository } from '../../bookings/repositories/booking-repository';
import { NotificationService } from '../../notifications/services/notification-service';
import { ParticipantRepository } from '../../participants/repositories/participant-repository';
import { RoomRepository } from '../../rooms/repositories/room-repository';
import { WaitlistConversionService } from '../../waitlist/services/waitlist-conversion-service';
import { CheckIn } from '../entities/check-in';
import { CheckInRepository } from '../repositories/check-in-repository';
import {
  CHECK_IN_WINDOW_MINUTES,
  checkInWindowEnd,
} from '../utils/check-in-window';

const CHECK_IN_UNIQUE_PG_CODE = '23505';

const isCheckInDuplicateViolation = (error: unknown): boolean => {
  const candidate = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return (
    (candidate.code ?? candidate.driverError?.code) ===
    CHECK_IN_UNIQUE_PG_CODE
  );
};

export class CheckInService {
  private readonly checkInRepository = new CheckInRepository();
  private readonly bookingRepository = new BookingRepository();
  private readonly participantRepository = new ParticipantRepository();
  private readonly roomRepository = new RoomRepository();
  private readonly employeeRepository = new EmployeeRepository();
  private readonly notificationService = new NotificationService();
  private readonly waitlistConversionService = new WaitlistConversionService();

  async checkIn(user: AuthUser | null, bookingId: number): Promise<Booking> {
    this.requireAuthenticated(user);

    const booking = await this.withDuplicateCheckInMapping(() =>
      AppDataSource.transaction(async (manager) => {
        const lockedBooking = await this.bookingRepository.findByIdForUpdate(
          manager,
          bookingId,
        );
        if (!lockedBooking) {
          throw new NotFoundError('Booking not found.');
        }

        await this.requireOrganizerOrParticipant(manager, user, lockedBooking);
        this.requireConfirmedBooking(lockedBooking);
        this.requireCheckInWindow(lockedBooking, new Date());

        const existingCheckIn =
          await this.checkInRepository.findByBookingIdInTransaction(
            manager,
            lockedBooking.id,
          );
        if (existingCheckIn) {
          throw new ConflictError('This booking has already been checked in.');
        }

        await this.checkInRepository.create(manager, {
          bookingId: lockedBooking.id,
          checkedInBy: user.id,
          checkedInAt: new Date(),
        });

        return lockedBooking;
      }),
    );

    await this.notifyBookingCheckedIn(booking, user.id);
    return booking;
  }

  async hasCheckedIn(
    user: AuthUser | null,
    bookingId: number,
  ): Promise<boolean> {
    this.requireAuthenticated(user);
    const checkIn = await this.checkInRepository.findByBookingId(bookingId);
    return checkIn !== null;
  }

  async getForBooking(
    user: AuthUser | null,
    bookingId: number,
  ): Promise<CheckIn | null> {
    this.requireAuthenticated(user);
    return this.checkInRepository.findByBookingId(bookingId);
  }

  async releaseNoShows(now: Date): Promise<Booking[]> {
    const cutoff = new Date(
      now.getTime() - CHECK_IN_WINDOW_MINUTES * 60_000,
    );
    const released: Booking[] = [];

    await AppDataSource.transaction(async (manager) => {
      const candidates = await this.bookingRepository.findNoShowCandidates(
        manager,
        cutoff,
      );

      for (const candidate of candidates) {
        const booking = await this.bookingRepository.findByIdForUpdate(
          manager,
          candidate.id,
        );
        if (!booking || booking.status !== BookingStatus.CONFIRMED) {
          continue;
        }

        const existingCheckIn =
          await this.checkInRepository.findByBookingIdInTransaction(
            manager,
            booking.id,
          );
        if (existingCheckIn) {
          continue;
        }

        const wasReleased = await this.bookingRepository.markNoShowIfConfirmed(
          manager,
          booking.id,
        );
        if (wasReleased) {
          released.push(booking);
        }
      }
    });

    for (const booking of released) {
      await this.waitlistConversionService.onBookingNoShowReleased(booking);
    }

    return released;
  }

  private async notifyBookingCheckedIn(
    booking: Booking,
    checkedInById: number,
  ): Promise<void> {
    const [room, organizer, checkedInBy] = await Promise.all([
      this.roomRepository.findById(booking.roomId),
      this.employeeRepository.findById(booking.organizerId),
      this.employeeRepository.findById(checkedInById),
    ]);
    if (!room || !organizer || !checkedInBy) {
      return;
    }
    if (organizer.id === checkedInBy.id) {
      return;
    }
    await this.notificationService.bookingCheckedIn(
      booking,
      room,
      organizer,
      checkedInBy,
    );
  }

  private async withDuplicateCheckInMapping<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!isCheckInDuplicateViolation(error)) {
        throw error;
      }
      throw new ConflictError('This booking has already been checked in.');
    }
  }

  private async requireOrganizerOrParticipant(
    manager: EntityManager,
    user: AuthUser,
    booking: Booking,
  ): Promise<void> {
    if (booking.organizerId === user.id) {
      return;
    }
    const participants = await this.participantRepository.findForBookingInTransaction(
      manager,
      booking.id,
      [user.id],
    );
    if (participants.length === 0) {
      throw new ForbiddenError();
    }
  }

  private requireConfirmedBooking(booking: Booking): void {
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError('Only confirmed bookings can be checked in to.');
    }
  }

  private requireCheckInWindow(booking: Booking, now: Date): void {
    if (booking.startTime.getTime() > now.getTime()) {
      throw new ValidationError(
        `Check-in opens at the booking's start time (${booking.startTime.toISOString()}).`,
      );
    }
    if (now.getTime() >= checkInWindowEnd(booking.startTime).getTime()) {
      throw new ValidationError(
        `The check-in window closed ${CHECK_IN_WINDOW_MINUTES} minutes after the booking's start time (${booking.startTime.toISOString()}).`,
      );
    }
  }

  private requireAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthenticatedError();
    }
  }
}
