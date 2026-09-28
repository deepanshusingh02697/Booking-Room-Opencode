import { EntityManager, LessThan, MoreThan } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Maintenance } from '../entities/maintenance';

export type NewMaintenanceData = Pick<
  Maintenance,
  'roomId' | 'startTime' | 'endTime'
> & {
  reason?: string;
};

export class MaintenanceRepository {
  private readonly repository = AppDataSource.getRepository(Maintenance);

  async create(
    manager: EntityManager,
    data: NewMaintenanceData,
  ): Promise<Maintenance> {
    const repository = manager.getRepository(Maintenance);
    const maintenance = repository.create(data);
    return repository.save(maintenance);
  }

  async findById(id: number): Promise<Maintenance | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findForRoom(roomId: number): Promise<Maintenance[]> {
    return this.repository.find({
      where: { roomId },
      order: { startTime: 'ASC', id: 'ASC' },
    });
  }

  /**
   * Every room's windows overlapping a range, in chronological order.
   *
   * The overlap test is the half-open `startTime < rangeEnd AND endTime >
   * rangeStart`, the same condition shape as
   * `BookingRepository.findConflictingBooking` and
   * `AnalyticsRepository.findBookingsOverlapping`, so "overlaps the range"
   * means one thing across Phases 6-12 and this query.
   */
  async findOverlapping(
    startTime: Date,
    endTime: Date,
  ): Promise<Maintenance[]> {
    return this.repository.find({
      where: {
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
      },
      order: { startTime: 'ASC', id: 'ASC' },
    });
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected === 1;
  }
}
