import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { RoomType } from '../../rooms/dto/room-type';
import { EquipmentType, toEquipmentType } from '../dto/equipment-type';
import { EquipmentService } from '../services/equipment-service';

@Resolver(() => RoomType)
export class RoomEquipmentFieldResolver {
  private readonly equipmentService = new EquipmentService();

  @FieldResolver(() => [EquipmentType])
  @Authorized()
  async equipment(
    @Root() room: RoomType,
    @Ctx() ctx: AppContext,
  ): Promise<EquipmentType[]> {
    const equipment = await this.equipmentService.listForRoom(ctx.user, room.id);
    return equipment.map(toEquipmentType);
  }
}
