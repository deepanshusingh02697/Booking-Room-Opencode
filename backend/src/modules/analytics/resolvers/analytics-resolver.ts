import { Arg, Authorized, Ctx, Query, Resolver } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { UserRole } from '../../auth/entities/employee';
import { BookingType, toBookingType } from '../../bookings/dto/booking-type';
import { DateRangeInput } from '../dto/date-range-input';
import {
  UsageAnalyticsType,
  toUsageAnalyticsType,
} from '../dto/usage-analytics-type';
import { AnalyticsService } from '../services/analytics-service';

@Resolver()
export class AnalyticsResolver {
  private readonly analyticsService = new AnalyticsService();

  @Query(() => [BookingType])
  @Authorized(UserRole.ADMIN)
  async adminCalendar(
    @Arg('input', () => DateRangeInput) input: DateRangeInput,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType[]> {
    const bookings = await this.analyticsService.adminCalendar(ctx.user, {
      startTime: input.startTime,
      endTime: input.endTime,
    });
    return bookings.map(toBookingType);
  }

  @Query(() => [UsageAnalyticsType])
  @Authorized(UserRole.ADMIN)
  async usageAnalytics(
    @Arg('input', () => DateRangeInput) input: DateRangeInput,
    @Ctx() ctx: AppContext,
  ): Promise<UsageAnalyticsType[]> {
    const usage = await this.analyticsService.usageAnalytics(ctx.user, {
      startTime: input.startTime,
      endTime: input.endTime,
    });
    return usage.map(toUsageAnalyticsType);
  }
}
