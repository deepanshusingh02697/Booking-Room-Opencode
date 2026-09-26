import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { CheckIn } from '../entities/check-in';

export type NewCheckInData = Pick<
  CheckIn,
  'bookingId' | 'checkedInBy'
> & {
  checkedInAt: Date;
};

export class CheckInRepository {
  private readonly repository = AppDataSource.getRepository(CheckIn);

  async create(
    manager: EntityManager,
    data: NewCheckInData,
  ): Promise<CheckIn> {
    const repository = manager.getRepository(CheckIn);
    const checkIn = repository.create(data);
    return repository.save(checkIn);
  }

  async findByBookingId(bookingId: number): Promise<CheckIn | null> {
    return this.repository.findOne({ where: { bookingId } });
  }

  async findByBookingIdInTransaction(
    manager: EntityManager,
    bookingId: number,
  ): Promise<CheckIn | null> {
    return manager
      .getRepository(CheckIn)
      .findOne({ where: { bookingId } });
  }
}
