import { AuthUser } from '../../../common/context';
import {
  ForbiddenError,
  UnauthenticatedError,
  ValidationError,
} from '../../../common/errors';
import { UserRole } from '../../auth/entities/employee';
import { Booking } from '../../bookings/entities/booking';
import {
  AnalyticsRepository,
  RoomUsage,
} from '../repositories/analytics-repository';

export interface AnalyticsDateRange {
  startTime: Date;
  endTime: Date;
}

export class AnalyticsService {
  private readonly analyticsRepository = new AnalyticsRepository();

  async adminCalendar(
    user: AuthUser | null,
    range: AnalyticsDateRange,
  ): Promise<Booking[]> {
    this.requireRole(user, UserRole.ADMIN);
    this.requireValidRange(range);
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
    this.requireValidRange(range);
    return this.analyticsRepository.findUsageByRoom(
      range.startTime,
      range.endTime,
    );
  }

  private requireValidRange(range: AnalyticsDateRange): void {
    if (range.startTime >= range.endTime) {
      throw new ValidationError(
        'Date range start time must be before end time.',
      );
    }
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
