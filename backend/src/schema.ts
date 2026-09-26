import { buildSchema, registerEnumType } from 'type-graphql';
import { authChecker } from './common/auth-checker';
import { HealthResolver } from './common/health-resolver';
import { AnalyticsResolver } from './modules/analytics/resolvers/analytics-resolver';
import { UserRole } from './modules/auth/entities/employee';
import { AuthResolver } from './modules/auth/resolvers/auth-resolver';
import { BookingStatus } from './modules/bookings/entities/booking';
import { BookingRelationsFieldResolver } from './modules/bookings/resolvers/booking-relations-field-resolver';
import { BookingResolver } from './modules/bookings/resolvers/booking-resolver';
import { RoomOccupancyFieldResolver } from './modules/bookings/resolvers/room-occupancy-field-resolver';
import { BookingCheckInFieldResolver } from './modules/checkin/resolvers/booking-check-in-field-resolver';
import { CheckInEmployeeFieldResolver } from './modules/checkin/resolvers/check-in-employee-field-resolver';
import { CheckInResolver } from './modules/checkin/resolvers/check-in-resolver';
import { MaintenanceResolver } from './modules/maintenance/resolvers/maintenance-resolver';
import { MaintenanceRoomFieldResolver } from './modules/maintenance/resolvers/maintenance-room-field-resolver';
import { EquipmentResolver } from './modules/equipment/resolvers/equipment-resolver';
import { RoomEquipmentFieldResolver } from './modules/equipment/resolvers/room-equipment-field-resolver';
import { RoomStatus } from './modules/rooms/entities/room';
import { RoomResolver } from './modules/rooms/resolvers/room-resolver';
import { RecurrenceFrequency } from './modules/bookings/utils/recurrence';
import { BookingParticipantsFieldResolver } from './modules/participants/resolvers/booking-participants-field-resolver';
import { ParticipantEmployeeFieldResolver } from './modules/participants/resolvers/participant-employee-field-resolver';
import { ParticipantResolver } from './modules/participants/resolvers/participant-resolver';
import { WaitlistEntryEmployeeFieldResolver } from './modules/waitlist/resolvers/waitlist-entry-employee-field-resolver';
import { WaitlistEntryRoomFieldResolver } from './modules/waitlist/resolvers/waitlist-entry-room-field-resolver';
import { WaitlistResolver } from './modules/waitlist/resolvers/waitlist-resolver';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role of an employee account.',
});

registerEnumType(RoomStatus, {
  name: 'RoomStatus',
  description: 'Operational status of a meeting room.',
});

registerEnumType(BookingStatus, {
  name: 'BookingStatus',
  description: 'Lifecycle status of a booking.',
});

registerEnumType(RecurrenceFrequency, {
  name: 'RecurrenceFrequency',
  description: 'How often a recurring booking repeats.',
});

export const createSchema = () =>
  buildSchema({
    resolvers: [
      HealthResolver,
      AuthResolver,
      AnalyticsResolver,
      RoomResolver,
      EquipmentResolver,
      RoomEquipmentFieldResolver,
      BookingResolver,
      BookingRelationsFieldResolver,
      RoomOccupancyFieldResolver,
      BookingParticipantsFieldResolver,
      ParticipantEmployeeFieldResolver,
      ParticipantResolver,
      CheckInResolver,
      BookingCheckInFieldResolver,
      CheckInEmployeeFieldResolver,
      MaintenanceResolver,
      MaintenanceRoomFieldResolver,
      WaitlistResolver,
      WaitlistEntryRoomFieldResolver,
      WaitlistEntryEmployeeFieldResolver,
    ],
    authChecker,
    validate: true,
  });
