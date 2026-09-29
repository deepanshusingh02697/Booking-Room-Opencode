import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Room } from '../modules/rooms/entities/room';
import { Equipment } from '../modules/equipment/entities/equipment';
import { RoomEquipment } from '../modules/equipment/entities/room-equipment';
import { Participant } from '../modules/participants/entities/participant';
import { Employee } from '../modules/auth/entities/employee';
import { CheckIn } from '../modules/checkin/entities/check-in';

export interface Loaders {
  roomById: DataLoader<number, Room | null>;
  employeeById: DataLoader<number, Employee | null>;
  equipmentsByRoomId: DataLoader<number, Equipment[]>;
  participantsByBookingId: DataLoader<number, Participant[]>;
  checkInByBookingId: DataLoader<number, CheckIn | null>;
}

const groupBy = <V>(rows: V[], keyOf: (row: V) => number): Map<number, V[]> => {
  const grouped = new Map<number, V[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(key, [row]);
    }
  }
  return grouped;
};

/**
 * One instance per request (see `AppContext.loaders`). Every GraphQL field
 * resolver asks for the same relation once per parent object, so batching turns
 * those per-item queries into a single query per field.
 *
 * Only relations that are fetched per parent object belong here — a loader that
 * would have to read an unbounded set of rows (all bookings of a room, all
 * maintenance windows) is slower than the query it replaces.
 */
export const createLoaders = (): Loaders => {
  const roomRepository = AppDataSource.getRepository(Room);
  const employeeRepository = AppDataSource.getRepository(Employee);
  const roomEquipmentRepository = AppDataSource.getRepository(RoomEquipment);
  const participantRepository = AppDataSource.getRepository(Participant);
  const checkInRepository = AppDataSource.getRepository(CheckIn);

  return {
    roomById: new DataLoader<number, Room | null>(async (roomIds) => {
      const rooms = await roomRepository.findBy({ id: In([...roomIds]) });
      const byKey = new Map(rooms.map((room) => [room.id, room]));
      return roomIds.map((roomId) => byKey.get(roomId) ?? null);
    }),

    employeeById: new DataLoader<number, Employee | null>(async (ids) => {
      const employees = await employeeRepository.findBy({ id: In([...ids]) });
      const byKey = new Map(employees.map((employee) => [employee.id, employee]));
      return ids.map((id) => byKey.get(id) ?? null);
    }),

    equipmentsByRoomId: new DataLoader<number, Equipment[]>(async (roomIds) => {
      const assignments = await roomEquipmentRepository.find({
        where: roomIds.map((roomId) => ({ roomId })),
        relations: { equipment: true },
      });
      const byRoom = groupBy(assignments, (assignment) => assignment.roomId);
      return roomIds.map((roomId) =>
        (byRoom.get(roomId) ?? []).map((assignment) => assignment.equipment),
      );
    }),

    participantsByBookingId: new DataLoader<number, Participant[]>(
      async (bookingIds) => {
        const participants = await participantRepository.find({
          where: bookingIds.map((bookingId) => ({ bookingId })),
          order: { id: 'ASC' },
        });
        const byBooking = groupBy(participants, (participant) => participant.bookingId);
        return bookingIds.map((bookingId) => byBooking.get(bookingId) ?? []);
      },
    ),

    checkInByBookingId: new DataLoader<number, CheckIn | null>(async (bookingIds) => {
      const checkIns = await checkInRepository.find({
        where: bookingIds.map((bookingId) => ({ bookingId })),
      });
      const byBooking = new Map(checkIns.map((checkIn) => [checkIn.bookingId, checkIn]));
      return bookingIds.map((bookingId) => byBooking.get(bookingId) ?? null);
    }),
  };
};
