import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { BookingType } from '../../bookings/dto/booking-type';
import { CheckInType, toCheckInType } from '../dto/check-in-type';
import { CheckInService } from '../services/check-in-service';

@Resolver(() => BookingType)
export class BookingCheckInFieldResolver {
  private readonly checkInService = new CheckInService();

  @FieldResolver(() => Boolean)
  @Authorized()
  async hasCheckedIn(
    @Root() booking: BookingType,
    @Ctx() ctx: AppContext,
  ): Promise<boolean> {
    return this.checkInService.hasCheckedIn(ctx.user, booking.id);
  }

  @FieldResolver(() => CheckInType, { nullable: true })
  @Authorized()
  async checkIn(
    @Root() booking: BookingType,
    @Ctx() ctx: AppContext,
  ): Promise<CheckInType | null> {
    const checkIn = await this.checkInService.getForBooking(
      ctx.user,
      booking.id,
    );
    return checkIn ? toCheckInType(checkIn) : null;
  }
}
