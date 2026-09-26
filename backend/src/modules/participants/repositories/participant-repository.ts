import { EntityManager, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Participant } from '../entities/participant';

export class ParticipantRepository {
  private readonly repository = AppDataSource.getRepository(Participant);

  async createForBooking(
    manager: EntityManager,
    bookingId: number,
    employeeIds: number[],
  ): Promise<Participant[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    const repository = manager.getRepository(Participant);
    const participants = repository.create(
      employeeIds.map((employeeId) => ({
        bookingId,
        employeeId,
      })),
    );
    return repository.save(participants);
  }

  async listForBooking(bookingId: number): Promise<Participant[]> {
    return this.repository.find({
      where: { bookingId },
      order: { id: 'ASC' },
    });
  }

  async findByBookingAndEmployee(
    bookingId: number,
    employeeId: number,
  ): Promise<Participant | null> {
    return this.repository.findOne({ where: { bookingId, employeeId } });
  }

  async existsForBookingsAndEmployee(
    bookingIds: number[],
    employeeId: number,
  ): Promise<boolean> {
    if (bookingIds.length === 0) {
      return false;
    }
    const count = await this.repository.count({
      where: { bookingId: In(bookingIds), employeeId },
    });
    return count > 0;
  }

  async findForBookingInTransaction(
    manager: EntityManager,
    bookingId: number,
    employeeIds: number[],
  ): Promise<Participant[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    return manager.getRepository(Participant).find({
      where: { bookingId, employeeId: In(employeeIds) },
    });
  }

  async countForBooking(bookingId: number): Promise<number> {
    return this.repository.count({ where: { bookingId } });
  }

  async countForBookingInTransaction(
    manager: EntityManager,
    bookingId: number,
  ): Promise<number> {
    return manager.getRepository(Participant).count({ where: { bookingId } });
  }

  async deleteForBookingAndEmployee(
    manager: EntityManager,
    bookingId: number,
    employeeId: number,
  ): Promise<boolean> {
    const result = await manager.getRepository(Participant).delete({
      bookingId,
      employeeId,
    });
    return result.affected === 1;
  }
}
