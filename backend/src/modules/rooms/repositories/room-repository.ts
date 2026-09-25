import { AppDataSource } from '../../../config/data-source';
import { Booking, BookingStatus } from '../../bookings/entities/booking';
import { Maintenance } from '../../maintenance/entities/maintenance';
import { RoomEquipment } from '../../equipment/entities/room-equipment';
import { Room, RoomStatus } from '../entities/room';

export interface RoomFilter {
  status?: RoomStatus;
  minCapacity?: number;
  floor?: number;
  equipmentIds?: number[];
  startTime?: Date;
  endTime?: Date;
}

export type NewRoomData = Pick<Room, 'name' | 'capacity' | 'floor' | 'location'> & {
  status: RoomStatus;
};

export type RoomUpdateData = Partial<Pick<Room, 'name' | 'capacity' | 'floor' | 'location'>>;

export class RoomRepository {
  private readonly repository = AppDataSource.getRepository(Room);

  async findById(id: number): Promise<Room | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Room | null> {
    return this.repository.findOne({ where: { name } });
  }

  async create(data: NewRoomData): Promise<Room> {
    const room = this.repository.create(data);
    return this.repository.save(room);
  }

  async update(id: number, data: RoomUpdateData): Promise<Room | null> {
    await this.repository.update({ id }, data);
    return this.findById(id);
  }

  async updateStatus(id: number, status: RoomStatus): Promise<Room | null> {
    await this.repository.update({ id }, { status });
    return this.findById(id);
  }

  async search(filter: RoomFilter): Promise<Room[]> {
    const query = this.repository.createQueryBuilder('room');

    if (filter.status) {
      query.andWhere('room.status = :status', { status: filter.status });
    }

    if (filter.minCapacity !== undefined) {
      query.andWhere('room.capacity >= :minCapacity', { minCapacity: filter.minCapacity });
    }

    if (filter.floor !== undefined) {
      query.andWhere('room.floor = :floor', { floor: filter.floor });
    }

    if (filter.equipmentIds && filter.equipmentIds.length > 0) {
      const distinctIds = [...new Set(filter.equipmentIds)];
      query
        .innerJoin(RoomEquipment, 're', 're.roomId = room.id')
        .andWhere('re.equipmentId IN (:...equipmentIds)', { equipmentIds: distinctIds })
        .groupBy('room.id')
        .having('COUNT(DISTINCT re.equipmentId) = :equipmentCount', {
          equipmentCount: distinctIds.length,
        });
    }

    if (filter.startTime && filter.endTime) {
      const busyRoomIds = await this.findBusyRoomIds(filter.startTime, filter.endTime);
      if (busyRoomIds.length > 0) {
        query.andWhere('room.id NOT IN (:...busyRoomIds)', { busyRoomIds });
      }
    }

    query.orderBy('room.name', 'ASC');
    return query.getMany();
  }

  private async findBusyRoomIds(startTime: Date, endTime: Date): Promise<number[]> {
    const bookedByRoomId = await this.repository
      .createQueryBuilder('room')
      .select('booking.roomId', 'roomId')
      .innerJoin(Booking, 'booking', 'booking.roomId = room.id')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('booking.startTime < :endTime', { endTime })
      .andWhere('booking.endTime > :startTime', { startTime })
      .getRawMany<{ roomId: number }>();

    const maintainedByRoomId = await this.repository
      .createQueryBuilder('room')
      .select('maintenance.roomId', 'roomId')
      .innerJoin(Maintenance, 'maintenance', 'maintenance.roomId = room.id')
      .where('maintenance.startTime < :endTime', { endTime })
      .andWhere('maintenance.endTime > :startTime', { startTime })
      .getRawMany<{ roomId: number }>();

    const busyRoomIds = new Set<number>([
      ...bookedByRoomId.map((row) => Number(row.roomId)),
      ...maintainedByRoomId.map((row) => Number(row.roomId)),
    ]);
    return [...busyRoomIds];
  }
}