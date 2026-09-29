import 'reflect-metadata';
import { expect, beforeAll, afterAll, it } from 'vitest';
import type { Logger } from 'typeorm';
import { createLoaders } from './dataloaders';
import { AppDataSource } from '../config/data-source';
import {
  createTestBooking,
  createTestEmployee,
  createTestParticipant,
  createTestRoom,
  describeDb,
  truncateTables,
} from '../test/test-utils';

const queries: string[] = [];
const logger: Logger = {
  logQuery: (query) => {
    queries.push(query);
  },
  logQueryError: () => undefined,
  logQuerySlow: () => undefined,
  logSchemaBuild: () => undefined,
  logMigration: () => undefined,
  log: () => undefined,
};

describeDb('DataLoaders batch per-request relation lookups', () => {
  beforeAll(async () => {
    AppDataSource.setOptions({ logger });
  });

  afterAll(async () => {
    AppDataSource.setOptions({ logger: undefined });
  });

  it('loads rooms, employees, participants and check-ins in one query each', async () => {
    await truncateTables();
    const organizer = await createTestEmployee({});
    const room = await createTestRoom({});
    const bookings = [
      await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'A',
        startTime: new Date(Date.now() + 3_600_000),
        endTime: new Date(Date.now() + 7_200_000),
      }),
      await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'B',
        startTime: new Date(Date.now() + 10_800_000),
        endTime: new Date(Date.now() + 14_400_000),
      }),
      await createTestBooking({
        roomId: room.id,
        organizerId: organizer.id,
        title: 'C',
        startTime: new Date(Date.now() + 18_000_000),
        endTime: new Date(Date.now() + 21_600_000),
      }),
    ];
    for (const booking of bookings) {
      await createTestParticipant(booking.id, organizer.id);
    }

    const loaders = createLoaders();
    queries.length = 0;

    const [rooms, employees, participants, checkIns] = await Promise.all([
      Promise.all(bookings.map(() => loaders.roomById.load(room.id))),
      Promise.all(bookings.map(() => loaders.employeeById.load(organizer.id))),
      Promise.all(
        bookings.map((booking) =>
          loaders.participantsByBookingId.load(booking.id),
        ),
      ),
      Promise.all(
        bookings.map((booking) => loaders.checkInByBookingId.load(booking.id)),
      ),
    ]);

    expect(queries).toHaveLength(4);
    expect(rooms.every((r) => r?.id === room.id)).toBe(true);
    expect(employees.every((e) => e?.id === organizer.id)).toBe(true);
    expect(participants.every((p) => p.length === 1)).toBe(true);
    expect(checkIns.every((c) => c === null)).toBe(true);
  });
});
