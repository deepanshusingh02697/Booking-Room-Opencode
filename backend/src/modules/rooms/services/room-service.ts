import { AuthUser } from '../../../common/context';
import { UserRole } from '../../auth/entities/employee';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from '../../../common/errors';
import { Room, RoomStatus } from '../entities/room';
import {
  RoomFilter,
  RoomRepository,
  RoomUpdateData,
} from '../repositories/room-repository';

export type RoomCreateData = Pick<Room, 'name' | 'capacity' | 'floor' | 'location'>;

export class RoomService {
  private readonly roomRepository = new RoomRepository();

  async create(user: AuthUser | null, data: RoomCreateData): Promise<Room> {
    this.requireRole(user, UserRole.ADMIN);

    const name = data.name.trim();
    const location = data.location.trim();
    if (name.length === 0) {
      throw new ValidationError('Room name is required.');
    }
    if (location.length === 0) {
      throw new ValidationError('Room location is required.');
    }

    const existing = await this.roomRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`A room named "${name}" already exists.`);
    }

    return this.roomRepository.create({
      name,
      capacity: data.capacity,
      floor: data.floor,
      location,
      status: RoomStatus.AVAILABLE,
    });
  }

  async update(
    user: AuthUser | null,
    id: number,
    data: RoomUpdateData,
  ): Promise<Room> {
    this.requireRole(user, UserRole.ADMIN);

    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    const update: RoomUpdateData = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (name.length === 0) {
        throw new ValidationError('Room name cannot be empty.');
      }
      const existing = await this.roomRepository.findByName(name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`A room named "${name}" already exists.`);
      }
      update.name = name;
    }

    if (data.capacity !== undefined) update.capacity = data.capacity;
    if (data.floor !== undefined) update.floor = data.floor;
    if (data.location !== undefined) {
      const location = data.location.trim();
      if (location.length === 0) {
        throw new ValidationError('Room location cannot be empty.');
      }
      update.location = location;
    }

    const updated = await this.roomRepository.update(id, update);
    if (!updated) {
      throw new NotFoundError('Room not found.');
    }
    return updated;
  }

  async setStatus(
    user: AuthUser | null,
    id: number,
    status: RoomStatus,
  ): Promise<Room> {
    this.requireRole(user, UserRole.ADMIN);

    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    const updated = await this.roomRepository.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Room not found.');
    }
    return updated;
  }

  async search(user: AuthUser | null, filter: RoomFilter = {}): Promise<Room[]> {
    this.requireAuthenticated(user);

    if (Boolean(filter.startTime) !== Boolean(filter.endTime)) {
      throw new ValidationError(
        'Provide both a start time and an end time, or neither.',
      );
    }

    return this.roomRepository.search(filter);
  }

  async getById(user: AuthUser | null, id: number): Promise<Room> {
    this.requireAuthenticated(user);

    const room = await this.roomRepository.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found.');
    }
    return room;
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