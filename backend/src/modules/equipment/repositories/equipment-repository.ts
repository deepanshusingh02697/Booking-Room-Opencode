import { AppDataSource } from '../../../config/data-source';
import { Equipment } from '../entities/equipment';
import { RoomEquipment } from '../entities/room-equipment';

export type NewEquipmentData = Pick<Equipment, 'name'>;

export type EquipmentUpdateData = Partial<Pick<Equipment, 'name'>>;

export class EquipmentRepository {
  private readonly repository = AppDataSource.getRepository(Equipment);
  private readonly roomEquipmentRepository =
    AppDataSource.getRepository(RoomEquipment);

  async findById(id: number): Promise<Equipment | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Equipment | null> {
    return this.repository.findOne({ where: { name } });
  }

  async list(): Promise<Equipment[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  async create(data: NewEquipmentData): Promise<Equipment> {
    const equipment = this.repository.create(data);
    return this.repository.save(equipment);
  }

  async update(
    id: number,
    data: EquipmentUpdateData,
  ): Promise<Equipment | null> {
    await this.repository.update({ id }, data);
    return this.findById(id);
  }

  async findAssignment(
    roomId: number,
    equipmentId: number,
  ): Promise<RoomEquipment | null> {
    return this.roomEquipmentRepository.findOne({
      where: { roomId, equipmentId },
    });
  }

  async createAssignment(
    roomId: number,
    equipmentId: number,
  ): Promise<RoomEquipment> {
    const assignment = this.roomEquipmentRepository.create({
      roomId,
      equipmentId,
    });
    return this.roomEquipmentRepository.save(assignment);
  }

  async removeAssignment(roomId: number, equipmentId: number): Promise<void> {
    await this.roomEquipmentRepository.delete({ roomId, equipmentId });
  }

  async listForRoom(roomId: number): Promise<Equipment[]> {
    return this.repository
      .createQueryBuilder('equipment')
      .innerJoin(RoomEquipment, 're', 're.equipmentId = equipment.id')
      .where('re.roomId = :roomId', { roomId })
      .orderBy('equipment.name', 'ASC')
      .getMany();
  }
}
