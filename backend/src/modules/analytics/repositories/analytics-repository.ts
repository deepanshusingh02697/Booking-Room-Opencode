import { LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Booking, BookingStatus } from '../../bookings/entities/booking';
import { Room } from '../../rooms/entities/room';

export interface RoomUsage {
  roomId: number;
  roomName: string;
  totalBookings: number;
  cancellations: number;
  noShows: number;
}

interface RoomUsageRow {
  roomId: number | string;
  roomName: string;
  totalBookings: number | string;
  cancellations: number | string;
  noShows: number | string;
}

export class AnalyticsRepository {
  private readonly roomRepository = AppDataSource.getRepository(Room);
  private readonly bookingRepository = AppDataSource.getRepository(Booking);

  async findBookingsOverlapping(
    startTime: Date,
    endTime: Date,
  ): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: {
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
      order: { startTime: 'ASC', id: 'ASC' },
    });
  }

  async findUsageByRoom(
    startTime: Date,
    endTime: Date,
  ): Promise<RoomUsage[]> {
    const rows = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoin(
        Booking,
        'booking',
        'booking.roomId = room.id AND booking.startTime < :endTime AND booking.endTime > :startTime',
        { startTime, endTime },
      )
      .select('room.id', 'roomId')
      .addSelect('room.name', 'roomName')
      .addSelect('COUNT(booking.id)', 'totalBookings')
      .addSelect(
        'COUNT(CASE WHEN booking.status = :cancelled THEN 1 END)',
        'cancellations',
      )
      .addSelect(
        'COUNT(CASE WHEN booking.status = :noShow THEN 1 END)',
        'noShows',
      )
      .setParameter('cancelled', BookingStatus.CANCELLED)
      .setParameter('noShow', BookingStatus.NO_SHOW)
      .groupBy('room.id')
      .addGroupBy('room.name')
      .orderBy('room.name', 'ASC')
      .getRawMany<RoomUsageRow>();

    return rows.map((row) => ({
      roomId: Number(row.roomId),
      roomName: row.roomName,
      totalBookings: Number(row.totalBookings),
      cancellations: Number(row.cancellations),
      noShows: Number(row.noShows),
    }));
  }
}
