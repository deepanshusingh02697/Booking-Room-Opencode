import { EntityManager } from 'typeorm';
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

  async deleteById(id: number): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected === 1;
  }
}
