import { AuthUser } from '../../../common/context';
import { logger } from '../../../common/logger';
import { EmployeeRepository } from '../../auth/repositories/employee-repository';
import { Booking } from '../../bookings/entities/booking';
import type { CreateBookingData } from '../../bookings/services/booking-service';
import { NotificationService } from '../../notifications/services/notification-service';
import { Room, RoomStatus } from '../../rooms/entities/room';
import { RoomRepository } from '../../rooms/repositories/room-repository';
import { WaitlistEntry } from '../entities/waitlist-entry';
import { WaitlistRepository } from '../repositories/waitlist-repository';
import { WAITLIST_CONVERSION_TITLE } from '../utils/waitlist-conversion';

export type WaitlistBookingCreator = (
  user: AuthUser,
  data: CreateBookingData,
) => Promise<Booking>;

export class WaitlistConversionService {
  private readonly waitlistRepository = new WaitlistRepository();
  private readonly employeeRepository = new EmployeeRepository();
  private readonly roomRepository = new RoomRepository();
  private readonly notificationService = new NotificationService();

  async onBookingCancelled(
    booking: Booking,
    createBooking: WaitlistBookingCreator,
  ): Promise<Booking | null> {
    const candidates = await this.waitlistRepository.findFifoOverlappingForRoom(
      booking.roomId,
      booking.startTime,
      booking.endTime,
    );

    if (candidates.length === 0) {
      logger.debug(
        `Waitlist conversion skipped: no waiting entry overlaps the freed slot of booking ${booking.id}.`,
      );
      return null;
    }

    const room = await this.roomRepository.findById(booking.roomId);
    if (!room || room.status !== RoomStatus.AVAILABLE) {
      logger.warn(
        `Waitlist conversion skipped for booking ${booking.id}: room ${booking.roomId} is not available for booking.`,
        { candidateCount: candidates.length },
      );
      return null;
    }

    for (const entry of candidates) {
      const converted = await this.convertEntry(entry, booking, room, createBooking);
      if (converted) {
        return converted;
      }
    }

    logger.warn(
      `Waitlist conversion skipped for booking ${booking.id}: none of the ${candidates.length} waiting entries could be converted.`,
    );
    return null;
  }

  async onBookingNoShowReleased(booking: Booking): Promise<void> {
    logger.info(
      `Waitlist conversion is not performed for no-show released booking ${booking.id}: the released slot has already started, so the waiting entries are left untouched.`,
    );
  }

  private async convertEntry(
    entry: WaitlistEntry,
    freedBooking: Booking,
    room: Room,
    createBooking: WaitlistBookingCreator,
  ): Promise<Booking | null> {
    const employee = await this.employeeRepository.findById(entry.employeeId);
    if (!employee) {
      return null;
    }

    const organizer: AuthUser = { id: employee.id, role: employee.role };

    let created: Booking;
    try {
      created = await createBooking(organizer, {
        roomId: freedBooking.roomId,
        title: WAITLIST_CONVERSION_TITLE,
        startTime: freedBooking.startTime,
        endTime: freedBooking.endTime,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        `Waitlist entry ${entry.id} could not be converted into a booking for employee ${employee.id}.`,
        { reason: message },
      );
      return null;
    }

    const removed = await this.waitlistRepository.deleteById(entry.id);
    if (!removed) {
      logger.warn(
        `Booking ${created.id} was created from waitlist entry ${entry.id}, but the entry could not be removed.`,
      );
    }

    await this.notificationService.waitlistConverted(
      created,
      room,
      employee,
      entry,
    );

    logger.info(
      `Waitlist entry ${entry.id} was converted into booking ${created.id} for employee ${employee.id} (${freedBooking.startTime.toISOString()} to ${freedBooking.endTime.toISOString()}).`,
    );

    return created;
  }
}
