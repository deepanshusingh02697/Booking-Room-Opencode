import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './env';
import { Employee } from '../modules/auth/entities/employee';
import { Room } from '../modules/rooms/entities/room';
import { Equipment } from '../modules/equipment/entities/equipment';
import { RoomEquipment } from '../modules/equipment/entities/room-equipment';
import { Booking } from '../modules/bookings/entities/booking';
import { Participant } from '../modules/participants/entities/participant';
import { CheckIn } from '../modules/checkin/entities/check-in';
import { WaitlistEntry } from '../modules/waitlist/entities/waitlist-entry';
import { Maintenance } from '../modules/maintenance/entities/maintenance';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [
    Employee,
    Room,
    Equipment,
    RoomEquipment,
    Booking,
    Participant,
    CheckIn,
    WaitlistEntry,
    Maintenance,
  ],
  migrations: [`${__dirname}/../migrations/*.{ts,js}`],
  synchronize: false,
  logging: env.NODE_ENV === 'development',
});