import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { RoomType, toRoomType } from '../../rooms/dto/room-type';
import { RoomService } from '../../rooms/services/room-service';
import { WaitlistEntryType } from '../dto/waitlist-entry-type';

@Resolver(() => WaitlistEntryType)
export class WaitlistEntryRoomFieldResolver {
  private readonly roomService = new RoomService();

  @FieldResolver(() => RoomType)
  @Authorized()
  async room(
    @Root() entry: WaitlistEntryType,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.getById(ctx.user, entry.roomId);
    return toRoomType(room);
  }
}
