import { Arg, Authorized, Ctx, Int, Mutation, Resolver } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { BookingType, toBookingType } from '../../bookings/dto/booking-type';
import { CheckInService } from '../services/check-in-service';

@Resolver()
export class CheckInResolver {
  private readonly checkInService = new CheckInService();

  @Mutation(() => BookingType)
  @Authorized()
  async checkIn(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType> {
    const booking = await this.checkInService.checkIn(ctx.user, id);
    return toBookingType(booking);
  }
}
