import { EntityManager, LessThan, LessThanOrEqual, MoreThan } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Maintenance } from '../../maintenance/entities/maintenance';
import { Participant } from '../../participants/entities/participant';
import { Booking, BookingStatus } from '../entities/booking';

export type NewBookingData = Pick<
  Booking,
  'roomId' | 'organizerId' | 'title' | 'startTime' | 'endTime'
> & {
  description?: string;
  recurrenceId?: string;
};

export class BookingRepository {
  private readonly repository = AppDataSource.getRepository(Booking);

  async create(
    manager: EntityManager,
    data: NewBookingData,
  ): Promise<Booking> {
    const repository = manager.getRepository(Booking);
    const booking = repository.create(data);
    return repository.save(booking);
  }

  async createMany(
    manager: EntityManager,
    bookings: NewBookingData[],
  ): Promise<Booking[]> {
    const repository = manager.getRepository(Booking);
    const created = repository.create(bookings);
    return repository.save(created);
  }

  async findByRecurrenceId(recurrenceId: string): Promise<Booking[]> {
    return this.repository.find({
      where: { recurrenceId },
      order: { startTime: 'ASC', id: 'ASC' },
    });
  }

  async findById(id: number): Promise<Booking | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findOrganizedBy(organizerId: number): Promise<Booking[]> {
    return this.repository.find({
      where: { organizerId },
      order: { startTime: 'DESC', id: 'DESC' },
    });
  }

  async findUpcomingForUser(userId: number, now: Date): Promise<Booking[]> {
    return this.repository
      .createQueryBuilder('booking')
      .leftJoin(
        Participant,
        'participant',
        'participant.bookingId = booking.id AND participant.employeeId = :userId',
        { userId },
      )
      .where('(booking.organizerId = :userId OR participant.id IS NOT NULL)', {
        userId,
      })
      .andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('booking.startTime > :now', { now })
      .orderBy('booking.startTime', 'ASC')
      .addOrderBy('booking.id', 'ASC')
      .getMany();
  }

  async findByIdForUpdate(
    manager: EntityManager,
    id: number,
  ): Promise<Booking | null> {
    return manager.getRepository(Booking).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async cancelIfConfirmed(id: number): Promise<Booking | null> {
    const result = await this.repository.update(
      { id, status: BookingStatus.CONFIRMED },
      { status: BookingStatus.CANCELLED },
    );
    if (result.affected !== 1) {
      return null;
    }
    return this.findById(id);
  }

  async findConflictingBooking(
    manager: EntityManager,
    roomId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<Booking | null> {
    return manager.getRepository(Booking).findOne({
      where: {
        roomId,
        status: BookingStatus.CONFIRMED,
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
      order: { startTime: 'DESC' },
    });
  }

  async findConflictingMaintenance(
    manager: EntityManager,
    roomId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<Maintenance | null> {
    return manager.getRepository(Maintenance).findOne({
      where: {
        roomId,
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
      order: { startTime: 'DESC' },
    });
  }

  async findActiveConfirmedForRoom(
    roomId: number,
    at: Date,
  ): Promise<Booking | null> {
    return this.repository.findOne({
      where: {
        roomId,
        status: BookingStatus.CONFIRMED,
        startTime: LessThanOrEqual(at),
        endTime: MoreThan(at),
      },
      order: { startTime: 'DESC' },
    });
  }
}
