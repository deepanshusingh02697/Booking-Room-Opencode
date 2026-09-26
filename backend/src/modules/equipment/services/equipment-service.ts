import { AuthUser } from '../../../common/context';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../../common/errors';
import { UserRole } from '../../auth/entities/employee';
import { Room } from '../../rooms/entities/room';
import { RoomRepository } from '../../rooms/repositories/room-repository';
import { Equipment } from '../entities/equipment';
import {
  EquipmentRepository,
  EquipmentUpdateData,
} from '../repositories/equipment-repository';

export type EquipmentCreateData = Pick<Equipment, 'name'>;

export class EquipmentService {
  private readonly equipmentRepository = new EquipmentRepository();
  private readonly roomRepository = new RoomRepository();

  async create(
    user: AuthUser | null,
    data: EquipmentCreateData,
  ): Promise<Equipment> {
    this.requireRole(user, UserRole.ADMIN);

    const name = data.name.trim();
    if (name.length === 0) {
      throw new ValidationError('Equipment name is required.');
    }

    const existing = await this.equipmentRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`Equipment named "${name}" already exists.`);
    }

    return this.equipmentRepository.create({ name });
  }

  async update(
    user: AuthUser | null,
    id: number,
    data: EquipmentUpdateData,
  ): Promise<Equipment> {
    this.requireRole(user, UserRole.ADMIN);

    const equipment = await this.requireEquipment(id);

    const update: EquipmentUpdateData = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length === 0) {
        throw new ValidationError('Equipment name cannot be empty.');
      }

      const existing = await this.equipmentRepository.findByName(name);
      if (existing && existing.id !== id) {
        throw new ConflictError(
          `Equipment named "${name}" already exists.`,
        );
      }

      update.name = name;
    }

    if (Object.keys(update).length === 0) {
      return equipment;
    }

    const updated = await this.equipmentRepository.update(id, update);
    if (!updated) {
      throw new NotFoundError('Equipment not found.');
    }
    return updated;
  }

  async list(user: AuthUser | null): Promise<Equipment[]> {
    this.requireAuthenticated(user);

    return this.equipmentRepository.list();
  }

  async assignToRoom(
    user: AuthUser | null,
    roomId: number,
    equipmentId: number,
  ): Promise<Room> {
    this.requireRole(user, UserRole.ADMIN);

    const room = await this.requireRoom(roomId);
    const equipment = await this.requireEquipment(equipmentId);

    const existing = await this.equipmentRepository.findAssignment(
      roomId,
      equipmentId,
    );
    if (existing) {
      throw new ConflictError(
        `${equipment.name} is already assigned to ${room.name}.`,
      );
    }

    await this.equipmentRepository.createAssignment(roomId, equipmentId);
    return room;
  }

  async removeFromRoom(
    user: AuthUser | null,
    roomId: number,
    equipmentId: number,
  ): Promise<Room> {
    this.requireRole(user, UserRole.ADMIN);

    const room = await this.requireRoom(roomId);
    const equipment = await this.requireEquipment(equipmentId);

    const existing = await this.equipmentRepository.findAssignment(
      roomId,
      equipmentId,
    );
    if (!existing) {
      throw new NotFoundError(
        `${equipment.name} is not assigned to ${room.name}.`,
      );
    }

    await this.equipmentRepository.removeAssignment(roomId, equipmentId);
    return room;
  }

  async listForRoom(
    user: AuthUser | null,
    roomId: number,
  ): Promise<Equipment[]> {
    this.requireAuthenticated(user);

    return this.equipmentRepository.listForRoom(roomId);
  }

  private async requireRoom(roomId: number): Promise<Room> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }
    return room;
  }

  private async requireEquipment(equipmentId: number): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findById(equipmentId);
    if (!equipment) {
      throw new NotFoundError('Equipment not found.');
    }
    return equipment;
  }

  private requireAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthenticatedError();
    }
  }

  private requireRole(user: AuthUser | null, role: UserRole): void {
    this.requireAuthenticated(user);
    if (user.role !== role) {
      throw new ForbiddenError();
    }
  }
}
