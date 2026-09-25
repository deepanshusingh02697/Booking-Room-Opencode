import { buildSchema, registerEnumType } from 'type-graphql';
import { authChecker } from './common/auth-checker';
import { HealthResolver } from './common/health-resolver';
import { UserRole } from './modules/auth/entities/employee';
import { AuthResolver } from './modules/auth/resolvers/auth-resolver';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role of an employee account.',
});

export const createSchema = () =>
  buildSchema({
    resolvers: [HealthResolver, AuthResolver],
    authChecker,
    validate: true,
  });
