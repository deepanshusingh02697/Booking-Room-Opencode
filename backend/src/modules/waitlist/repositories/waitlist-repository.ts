import { AppDataSource } from '../../../config/data-source';
import { WaitlistEntry } from '../entities/waitlist-entry';

export type NewWaitlistEntryData = Pick<
  WaitlistEntry,
  'roomId' | 'employeeId' | 'startTime' | 'endTime'
>;

export class WaitlistRepository {
  private readonly repository = AppDataSource.getRepository(WaitlistEntry);

  async create(data: NewWaitlistEntryData): Promise<WaitlistEntry> {
    const entry = this.repository.create(data);
    return this.repository.save(entry);
  }

  async findById(id: number): Promise<WaitlistEntry | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmployee(employeeId: number): Promise<WaitlistEntry[]> {
    return this.repository.find({
      where: { employeeId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async findOverlappingForEmployee(
    roomId: number,
    employeeId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<WaitlistEntry | null> {
    return this.repository
      .createQueryBuilder('entry')
      .where('entry.roomId = :roomId', { roomId })
      .andWhere('entry.employeeId = :employeeId', { employeeId })
      .andWhere('entry.startTime < :endTime', { endTime })
      .andWhere('entry.endTime > :startTime', { startTime })
      .orderBy('entry.createdAt', 'ASC')
      .addOrderBy('entry.id', 'ASC')
      .getOne();
  }

  async findFifoOverlappingForRoom(
    roomId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<WaitlistEntry[]> {
    return this.repository
      .createQueryBuilder('entry')
      .where('entry.roomId = :roomId', { roomId })
      .andWhere('entry.startTime < :endTime', { endTime })
      .andWhere('entry.endTime > :startTime', { startTime })
      .orderBy('entry.createdAt', 'ASC')
      .addOrderBy('entry.id', 'ASC')
      .getMany();
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected === 1;
  }
}
