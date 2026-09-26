import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { RoomType, toRoomType } from '../../rooms/dto/room-type';
import { RoomService } from '../../rooms/services/room-service';
import { MaintenanceType } from '../dto/maintenance-type';

@Resolver(() => MaintenanceType)
export class MaintenanceRoomFieldResolver {
  private readonly roomService = new RoomService();

  @FieldResolver(() => RoomType)
  @Authorized()
  async room(
    @Root() maintenance: MaintenanceType,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.getById(ctx.user, maintenance.roomId);
    return toRoomType(room);
  }
}
