import { AuthUser } from '../../../common/context';
import {
  assertValidDateRange,
  type DateRange,
} from '../../../common/date-range';
import { ForbiddenError, UnauthenticatedError } from '../../../common/errors';
import { UserRole } from '../../auth/entities/employee';
import { Booking } from '../../bookings/entities/booking';
import {
  AnalyticsRepository,
  RoomUsage,
} from '../repositories/analytics-repository';

export type AnalyticsDateRange = DateRange;

export class AnalyticsService {
  private readonly analyticsRepository = new AnalyticsRepository();

  async adminCalendar(
    user: AuthUser | null,
    range: AnalyticsDateRange,
  ): Promise<Booking[]> {
    this.requireRole(user, UserRole.ADMIN);
    assertValidDateRange(range);
    return this.analyticsRepository.findBookingsOverlapping(
      range.startTime,
      range.endTime,
    );
  }

  async usageAnalytics(
    user: AuthUser | null,
    range: AnalyticsDateRange,
  ): Promise<RoomUsage[]> {
    this.requireRole(user, UserRole.ADMIN);
    assertValidDateRange(range);
    return this.analyticsRepository.findUsageByRoom(
      range.startTime,
      range.endTime,
    );
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
