import { AuthChecker } from 'type-graphql';
import { UserRole } from '../modules/auth/entities/employee';
import { AppContext } from './context';
import { ForbiddenError, UnauthenticatedError } from './errors';

export const authChecker: AuthChecker<AppContext, UserRole> = (
  { context },
  roles,
) => {
  if (!context.user) {
    throw new UnauthenticatedError();
  }
  if (roles.length === 0 || roles.includes(context.user.role)) {
    return true;
  }
  throw new ForbiddenError();
};
