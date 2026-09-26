import { AuthUser } from '../../../common/context';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../../common/errors';
import { AppDataSource } from '../../../config/data-source';
import { Employee, UserRole } from '../../auth/entities/employee';
import { EmployeeRepository } from '../../auth/repositories/employee-repository';
import { Maintenance } from '../../maintenance/entities/maintenance';
import { NotificationService } from '../../notifications/services/notification-service';
import { ParticipantRepository } from '../../participants/repositories/participant-repository';
import { Room, RoomStatus } from '../../rooms/entities/room';
import { RoomRepository } from '../../rooms/repositories/room-repository';
import { WaitlistConversionService } from '../../waitlist/services/waitlist-conversion-service';
import { Booking, BookingStatus } from '../entities/booking';
import {
  BookingRepository,
  NewBookingData,
} from '../repositories/booking-repository';
import {
  BOOKING_CHANGE_WINDOW_MINUTES,
  isBookingChangeWindowOpen,
} from '../utils/booking-time-policy';
import {
  buildRecurrenceId,
  generateOccurrences,
  RecurrenceFrequency,
} from '../utils/recurrence';

export interface CreateBookingData {
  roomId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  participantIds?: number[];
  recurrence?: {
    frequency: RecurrenceFrequency;
    endDate: Date;
  };
}

export interface AddBookingParticipantsData {
  bookingId: number;
  employeeIds: number[];
}

export interface RemoveBookingParticipantData {
  bookingId: number;
  employeeId: number;
}

export interface RoomOccupancy {
  occupantCount: number;
  remainingCapacity: number;
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

const BOOKING_OVERLAP_PG_CODE = '23P01';

const isBookingOverlapViolation = (error: unknown): boolean => {
  const candidate = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return (candidate.code ?? candidate.driverError?.code) === BOOKING_OVERLAP_PG_CODE;
};

export class BookingService {
  private readonly bookingRepository = new BookingRepository();
  private readonly participantRepository = new ParticipantRepository();
  private readonly roomRepository = new RoomRepository();
  private readonly employeeRepository = new EmployeeRepository();
  private readonly notificationService = new NotificationService();
  private readonly waitlistConversionService = new WaitlistConversionService();

  async create(user: AuthUser | null, data: CreateBookingData): Promise<Booking> {
    this.requireRole(user, UserRole.EMPLOYEE);

    const title = data.title.trim();
    if (title.length === 0) {
      throw new ValidationError('Booking title is required.');
    }

    let description: string | undefined;
    if (data.description !== undefined) {
      const trimmed = data.description.trim();
      if (trimmed.length === 0) {
        throw new ValidationError('Booking description cannot be empty.');
      }
      description = trimmed;
    }

    if (data.startTime >= data.endTime) {
      throw new ValidationError('Booking start time must be before end time.');
    }

    if (data.startTime.getTime() <= Date.now()) {
      throw new ValidationError('Booking start time cannot be in the past.');
    }

    const participantIds = data.participantIds ?? [];
    if (new Set(participantIds).size !== participantIds.length) {
      throw new ValidationError('Participant ids contains duplicates.');
    }
    if (participantIds.includes(user.id)) {
      throw new ValidationError(
        'The organizer is already part of the booking and cannot be added as a participant.',
      );
    }

    const participants = await this.employeeRepository.findByIds(
      participantIds,
    );
    if (participants.length !== participantIds.length) {
      throw new NotFoundError('One or more participants were not found.');
    }

    const organizer = await this.employeeRepository.findById(user.id);
    if (!organizer) {
      throw new UnauthenticatedError();
    }

    const room = await this.roomRepository.findById(data.roomId);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }
    if (room.status !== RoomStatus.AVAILABLE) {
      throw new ValidationError(
        `Room "${room.name}" is not available for booking (current status: ${room.status}).`,
      );
    }

    const attendeeCount = participantIds.length + 1;
    if (attendeeCount > room.capacity) {
      throw new ValidationError(
        `This booking needs space for ${attendeeCount} attendees (organizer plus participants), but room "${room.name}" fits ${room.capacity}.`,
      );
    }

    const bookingData: NewBookingData = {
      roomId: room.id,
      organizerId: organizer.id,
      title,
      description,
      startTime: data.startTime,
      endTime: data.endTime,
    };

    if (data.recurrence) {
      const occurrences = generateOccurrences(
        data.startTime,
        data.endTime,
        data.recurrence.frequency,
        data.recurrence.endDate,
      );
      const recurrenceId = buildRecurrenceId();
      const bookingsData: NewBookingData[] = occurrences.map(
        (occurrence) => ({
          ...bookingData,
          startTime: occurrence.startTime,
          endTime: occurrence.endTime,
          recurrenceId,
        }),
      );

      const createdBookings = await this.createRecurringWithConflictMapping(
        bookingsData,
        room,
        participantIds,
      );

      for (const occurrence of createdBookings) {
        await this.notificationService.bookingCreated(
          occurrence,
          room,
          organizer,
          participants,
        );
      }

      return [...createdBookings].sort(
        (first, second) =>
          first.startTime.getTime() - second.startTime.getTime(),
      )[0];
    }

    const booking = await this.createWithConflictMapping(
      bookingData,
      room,
      participantIds,
    );

    await this.notificationService.bookingCreated(
      booking,
      room,
      organizer,
      participants,
    );

    return booking;
  }

  async myBookings(user: AuthUser | null): Promise<Booking[]> {
    this.requireAuthenticated(user);
    return this.bookingRepository.findOrganizedBy(user.id);
  }

  async myMeetings(user: AuthUser | null): Promise<Booking[]> {
    this.requireAuthenticated(user);
    return this.bookingRepository.findUpcomingForUser(user.id, new Date());
  }

  async getById(user: AuthUser | null, id: number): Promise<Booking> {
    this.requireAuthenticated(user);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    if (user.role === UserRole.ADMIN || booking.organizerId === user.id) {
      return booking;
    }

    const participant = await this.participantRepository.findByBookingAndEmployee(
      booking.id,
      user.id,
    );
    if (!participant) {
      throw new ForbiddenError();
    }

    return booking;
  }

  async recurringBookingGroup(
    user: AuthUser | null,
    recurrenceId: string,
  ): Promise<Booking[]> {
    this.requireAuthenticated(user);

    const trimmedId = recurrenceId.trim();
    if (trimmedId.length === 0) {
      throw new ValidationError('Recurrence id is required.');
    }

    const occurrences =
      await this.bookingRepository.findByRecurrenceId(trimmedId);
    if (occurrences.length === 0) {
      throw new NotFoundError('Recurring booking group not found.');
    }

    if (user.role === UserRole.ADMIN) {
      return occurrences;
    }

    if (
      occurrences.some((occurrence) => occurrence.organizerId === user.id)
    ) {
      return occurrences;
    }

    const isParticipant =
      await this.participantRepository.existsForBookingsAndEmployee(
        occurrences.map((occurrence) => occurrence.id),
        user.id,
      );
    if (!isParticipant) {
      throw new ForbiddenError();
    }

    return occurrences;
  }

  async cancel(user: AuthUser | null, id: number): Promise<Booking> {
    this.requireAuthenticated(user);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    this.requireOrganizerOrAdmin(user, booking);
    this.requireConfirmedBooking(booking);
    this.requireBookingChangeWindow(
      booking,
      `Bookings can only be cancelled until ${BOOKING_CHANGE_WINDOW_MINUTES} minutes before they start.`,
    );

    const cancelled = await this.bookingRepository.cancelIfConfirmed(id);
    if (!cancelled) {
      throw new ValidationError('This booking is no longer confirmed.');
    }

    await this.waitlistConversionService.onBookingCancelled(cancelled);
    return cancelled;
  }

  async addParticipants(
    user: AuthUser | null,
    data: AddBookingParticipantsData,
  ): Promise<Booking> {
    this.requireAuthenticated(user);
    this.requireDistinctParticipantIds(data.employeeIds);

    const booking = await this.withSerializableRetry(() =>
      this.addParticipantsInTransaction(user, data),
    );
    await this.notifyParticipantsAdded(booking, data.employeeIds);
    return booking;
  }

  async removeParticipant(
    user: AuthUser | null,
    data: RemoveBookingParticipantData,
  ): Promise<Booking> {
    this.requireAuthenticated(user);

    const booking = await this.withSerializableRetry(() =>
      this.removeParticipantInTransaction(user, data),
    );
    await this.notifyParticipantRemoved(booking, data.employeeId);
    return booking;
  }

  async currentOccupancy(
    user: AuthUser | null,
    roomId: number,
  ): Promise<RoomOccupancy> {
    this.requireAuthenticated(user);

    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    const activeBooking = await this.bookingRepository.findActiveConfirmedForRoom(
      roomId,
      new Date(),
    );
    if (!activeBooking) {
      return { occupantCount: 0, remainingCapacity: room.capacity };
    }

    const participantCount = await this.participantRepository.countForBooking(
      activeBooking.id,
    );
    const occupantCount = participantCount + 1;

    return {
      occupantCount,
      remainingCapacity: room.capacity - occupantCount,
    };
  }

  private async addParticipantsInTransaction(
    user: AuthUser,
    data: AddBookingParticipantsData,
  ): Promise<Booking> {
    return AppDataSource.transaction(async (manager) => {
      const booking = await this.bookingRepository.findByIdForUpdate(
        manager,
        data.bookingId,
      );
      if (!booking) {
        throw new NotFoundError('Booking not found.');
      }

      this.requireOrganizerOrAdmin(user, booking);
      this.requireConfirmedBooking(booking);
      this.requireBookingChangeWindow(
        booking,
        `Participants can only be added or removed until ${BOOKING_CHANGE_WINDOW_MINUTES} minutes before the booking starts.`,
      );

      if (data.employeeIds.includes(booking.organizerId)) {
        throw new ValidationError(
          'The organizer is already part of the booking and cannot be added as a participant.',
        );
      }

      const employees = await this.employeeRepository.findByIds(
        data.employeeIds,
      );
      if (employees.length !== data.employeeIds.length) {
        throw new NotFoundError('One or more employees were not found.');
      }

      const existingParticipants =
        await this.participantRepository.findForBookingInTransaction(
          manager,
          booking.id,
          data.employeeIds,
        );
      if (existingParticipants.length > 0) {
        throw new ConflictError(
          'One or more employees are already participants of this booking.',
        );
      }

      const room = await this.roomRepository.findById(booking.roomId);
      if (!room) {
        throw new NotFoundError('Room not found.');
      }

      const attendeeCount =
        (await this.participantRepository.countForBookingInTransaction(
          manager,
          booking.id,
        )) +
        data.employeeIds.length +
        1;
      if (attendeeCount > room.capacity) {
        throw new ValidationError(
          `Adding ${data.employeeIds.length} participant(s) would require space for ${attendeeCount} attendees, but room "${room.name}" fits ${room.capacity}.`,
        );
      }

      await this.participantRepository.createForBooking(
        manager,
        booking.id,
        data.employeeIds,
      );
      return booking;
    });
  }

  private async removeParticipantInTransaction(
    user: AuthUser,
    data: RemoveBookingParticipantData,
  ): Promise<Booking> {
    return AppDataSource.transaction(async (manager) => {
      const booking = await this.bookingRepository.findByIdForUpdate(
        manager,
        data.bookingId,
      );
      if (!booking) {
        throw new NotFoundError('Booking not found.');
      }

      const targetParticipants =
        await this.participantRepository.findForBookingInTransaction(
          manager,
          booking.id,
          [data.employeeId],
        );
      const isTargetAParticipant = targetParticipants.length > 0;
      const canRemoveAnyParticipant =
        user.role === UserRole.ADMIN || booking.organizerId === user.id;
      const canRemoveSelf = isTargetAParticipant && user.id === data.employeeId;
      if (!canRemoveAnyParticipant && !canRemoveSelf) {
        throw new ForbiddenError();
      }

      this.requireConfirmedBooking(booking);
      this.requireBookingChangeWindow(
        booking,
        `Participants can only be added or removed until ${BOOKING_CHANGE_WINDOW_MINUTES} minutes before the booking starts.`,
      );

      if (!isTargetAParticipant) {
        throw new NotFoundError('Participant not found on this booking.');
      }

      const deleted = await this.participantRepository.deleteForBookingAndEmployee(
        manager,
        booking.id,
        data.employeeId,
      );
      if (!deleted) {
        throw new ConflictError('Participant could not be removed.');
      }

      return booking;
    });
  }

  private async createInTransaction(
    bookingData: NewBookingData,
    room: Room,
    participantIds: number[],
  ): Promise<Booking> {
    return AppDataSource.transaction('SERIALIZABLE', async (manager) => {
      const conflictingBooking = await this.bookingRepository.findConflictingBooking(
        manager,
        bookingData.roomId,
        bookingData.startTime,
        bookingData.endTime,
      );
      if (conflictingBooking) {
        throw new ConflictError(
          this.buildBookingConflictMessage(room, conflictingBooking),
        );
      }

      const conflictingMaintenance =
        await this.bookingRepository.findConflictingMaintenance(
          manager,
          bookingData.roomId,
          bookingData.startTime,
          bookingData.endTime,
        );
      if (conflictingMaintenance) {
        const reason = conflictingMaintenance.reason
          ? ` (${conflictingMaintenance.reason})`
          : '';
        throw new ConflictError(
          `Room "${room.name}" is under maintenance during the requested time, ${conflictingMaintenance.startTime.toISOString()} to ${conflictingMaintenance.endTime.toISOString()}${reason}.`,
        );
      }

      const booking = await this.bookingRepository.create(manager, bookingData);
      await this.participantRepository.createForBooking(
        manager,
        booking.id,
        participantIds,
      );

      return booking;
    });
  }

  private async createRecurringInTransaction(
    bookingsData: NewBookingData[],
    room: Room,
    participantIds: number[],
  ): Promise<Booking[]> {
    return AppDataSource.transaction('SERIALIZABLE', async (manager) => {
      for (const bookingData of bookingsData) {
        const conflictingBooking =
          await this.bookingRepository.findConflictingBooking(
            manager,
            bookingData.roomId,
            bookingData.startTime,
            bookingData.endTime,
          );
        if (conflictingBooking) {
          throw new ConflictError(
            this.buildRecurringBookingConflictMessage(
              room,
              bookingData,
              conflictingBooking,
            ),
          );
        }

        const conflictingMaintenance =
          await this.bookingRepository.findConflictingMaintenance(
            manager,
            bookingData.roomId,
            bookingData.startTime,
            bookingData.endTime,
          );
        if (conflictingMaintenance) {
          throw new ConflictError(
            this.buildRecurringMaintenanceConflictMessage(
              room,
              bookingData,
              conflictingMaintenance,
            ),
          );
        }
      }

      const createdBookings = await this.bookingRepository.createMany(
        manager,
        bookingsData,
      );
      for (const booking of createdBookings) {
        await this.participantRepository.createForBooking(
          manager,
          booking.id,
          participantIds,
        );
      }

      return createdBookings;
    });
  }

  private async createRecurringWithConflictMapping(
    bookingsData: NewBookingData[],
    room: Room,
    participantIds: number[],
  ): Promise<Booking[]> {
    try {
      return await this.withSerializableRetry(() =>
        this.createRecurringInTransaction(bookingsData, room, participantIds),
      );
    } catch (error) {
      if (!isBookingOverlapViolation(error)) {
        throw error;
      }
      for (const bookingData of bookingsData) {
        const conflictingBooking =
          await this.bookingRepository.findConflictingBooking(
            AppDataSource.manager,
            bookingData.roomId,
            bookingData.startTime,
            bookingData.endTime,
          );
        if (conflictingBooking) {
          throw new ConflictError(
            this.buildRecurringBookingConflictMessage(
              room,
              bookingData,
              conflictingBooking,
            ),
          );
        }
      }
      throw new ConflictError(
        `Room "${room.name}" is already booked for one of the requested occurrences.`,
      );
    }
  }

  private buildRecurringBookingConflictMessage(
    room: Room,
    occurrence: NewBookingData,
    conflictingBooking: Booking,
  ): string {
    return `Room "${room.name}" is already booked for the occurrence at ${occurrence.startTime.toISOString()} (conflicts with "${conflictingBooking.title}", ${conflictingBooking.startTime.toISOString()} to ${conflictingBooking.endTime.toISOString()}).`;
  }

  private buildRecurringMaintenanceConflictMessage(
    room: Room,
    occurrence: NewBookingData,
    conflictingMaintenance: Maintenance,
  ): string {
    const reason = conflictingMaintenance.reason
      ? ` (${conflictingMaintenance.reason})`
      : '';
    return `Room "${room.name}" is under maintenance during the occurrence at ${occurrence.startTime.toISOString()} (${conflictingMaintenance.startTime.toISOString()} to ${conflictingMaintenance.endTime.toISOString()}${reason}).`;
  }

  private async notifyParticipantsAdded(
    booking: Booking,
    employeeIds: number[],
  ): Promise<void> {
    const [room, organizer, employees] = await Promise.all([
      this.roomRepository.findById(booking.roomId),
      this.employeeRepository.findById(booking.organizerId),
      this.employeeRepository.findByIds(employeeIds),
    ]);
    if (!room || !organizer || employees.length !== employeeIds.length) {
      return;
    }
    await this.notificationService.participantsAdded(
      booking,
      room,
      organizer,
      employees,
    );
  }

  private async notifyParticipantRemoved(
    booking: Booking,
    employeeId: number,
  ): Promise<void> {
    const [room, organizer, employee] = await Promise.all([
      this.roomRepository.findById(booking.roomId),
      this.employeeRepository.findById(booking.organizerId),
      this.employeeRepository.findById(employeeId),
    ]);
    if (!room || !organizer || !employee) {
      return;
    }
    await this.notificationService.participantRemoved(
      booking,
      room,
      organizer,
      employee,
    );
  }

  private buildBookingConflictMessage(
    room: Room,
    conflictingBooking: Booking,
  ): string {
    return `Room "${room.name}" is already booked for the requested time (conflicts with "${conflictingBooking.title}", ${conflictingBooking.startTime.toISOString()} to ${conflictingBooking.endTime.toISOString()}).`;
  }

  private async createWithConflictMapping(
    bookingData: NewBookingData,
    room: Room,
    participantIds: number[],
  ): Promise<Booking> {
    try {
      return await this.withSerializableRetry(() =>
        this.createInTransaction(bookingData, room, participantIds),
      );
    } catch (error) {
      if (!isBookingOverlapViolation(error)) {
        throw error;
      }
      const conflictingBooking =
        await this.bookingRepository.findConflictingBooking(
          AppDataSource.manager,
          bookingData.roomId,
          bookingData.startTime,
          bookingData.endTime,
        );
      throw new ConflictError(
        conflictingBooking
          ? this.buildBookingConflictMessage(room, conflictingBooking)
          : `Room "${room.name}" is already booked for the requested time.`,
      );
    }
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
            'The room schedule was updated while the booking was being saved. Please try again.',
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

  private requireOrganizerOrAdmin(user: AuthUser, booking: Booking): void {
    if (user.role !== UserRole.ADMIN && booking.organizerId !== user.id) {
      throw new ForbiddenError();
    }
  }

  private requireConfirmedBooking(booking: Booking): void {
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ValidationError('Only confirmed bookings can be modified.');
    }
  }

  private requireBookingChangeWindow(
    booking: Booking,
    message: string,
  ): void {
    if (!isBookingChangeWindowOpen(booking.startTime, new Date())) {
      throw new ValidationError(message);
    }
  }

  private requireDistinctParticipantIds(employeeIds: number[]): void {
    if (employeeIds.length === 0) {
      throw new ValidationError('Provide at least one employee id.');
    }
    if (new Set(employeeIds).size !== employeeIds.length) {
      throw new ValidationError('Employee ids contains duplicates.');
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
