import { buildSchema, registerEnumType } from 'type-graphql';
import { authChecker } from './common/auth-checker';
import { HealthResolver } from './common/health-resolver';
import { UserRole } from './modules/auth/entities/employee';
import { AuthResolver } from './modules/auth/resolvers/auth-resolver';
import { RoomStatus } from './modules/rooms/entities/room';
import { RoomResolver } from './modules/rooms/resolvers/room-resolver';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role of an employee account.',
});

registerEnumType(RoomStatus, {
  name: 'RoomStatus',
  description: 'Operational status of a meeting room.',
});

export const createSchema = () =>
  buildSchema({
    resolvers: [HealthResolver, AuthResolver, RoomResolver],
    authChecker,
    validate: true,
  });
