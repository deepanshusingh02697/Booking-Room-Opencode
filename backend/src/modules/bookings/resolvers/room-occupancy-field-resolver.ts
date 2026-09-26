import { Authorized, Ctx, FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { RoomType } from '../../rooms/dto/room-type';
import { BookingService } from '../services/booking-service';

@Resolver(() => RoomType)
export class RoomOccupancyFieldResolver {
  private readonly bookingService = new BookingService();

  @FieldResolver(() => Int)
  @Authorized()
  async occupantCount(
    @Root() room: RoomType,
    @Ctx() ctx: AppContext,
  ): Promise<number> {
    const occupancy = await this.bookingService.currentOccupancy(
      ctx.user,
      room.id,
    );
    return occupancy.occupantCount;
  }

  @FieldResolver(() => Int)
  @Authorized()
  async remainingCapacity(
    @Root() room: RoomType,
    @Ctx() ctx: AppContext,
  ): Promise<number> {
    const occupancy = await this.bookingService.currentOccupancy(
      ctx.user,
      room.id,
    );
    return occupancy.remainingCapacity;
  }
}
