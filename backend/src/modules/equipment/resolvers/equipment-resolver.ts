import {
  Arg,
  Authorized,
  Ctx,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { AppContext } from '../../../common/context';
import { UserRole } from '../../auth/entities/employee';
import { RoomType, toRoomType } from '../../rooms/dto/room-type';
import { CreateEquipmentInput } from '../dto/create-equipment-input';
import { EquipmentType, toEquipmentType } from '../dto/equipment-type';
import { RoomEquipmentInput } from '../dto/room-equipment-input';
import { UpdateEquipmentInput } from '../dto/update-equipment-input';
import { EquipmentService } from '../services/equipment-service';

@Resolver()
export class EquipmentResolver {
  private readonly equipmentService = new EquipmentService();

  @Query(() => [EquipmentType])
  @Authorized()
  async equipment(@Ctx() ctx: AppContext): Promise<EquipmentType[]> {
    const equipment = await this.equipmentService.list(ctx.user);
    return equipment.map(toEquipmentType);
  }

  @Mutation(() => EquipmentType)
  @Authorized(UserRole.ADMIN)
  async createEquipment(
    @Arg('input', () => CreateEquipmentInput) input: CreateEquipmentInput,
    @Ctx() ctx: AppContext,
  ): Promise<EquipmentType> {
    const equipment = await this.equipmentService.create(ctx.user, input);
    return toEquipmentType(equipment);
  }

  @Mutation(() => EquipmentType)
  @Authorized(UserRole.ADMIN)
  async updateEquipment(
    @Arg('input', () => UpdateEquipmentInput) input: UpdateEquipmentInput,
    @Ctx() ctx: AppContext,
  ): Promise<EquipmentType> {
    const equipment = await this.equipmentService.update(ctx.user, input.id, {
      name: input.name,
    });
    return toEquipmentType(equipment);
  }

  @Mutation(() => RoomType)
  @Authorized(UserRole.ADMIN)
  async assignEquipmentToRoom(
    @Arg('input', () => RoomEquipmentInput) input: RoomEquipmentInput,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.equipmentService.assignToRoom(
      ctx.user,
      input.roomId,
      input.equipmentId,
    );
    return toRoomType(room);
  }

  @Mutation(() => RoomType)
  @Authorized(UserRole.ADMIN)
  async removeEquipmentFromRoom(
    @Arg('input', () => RoomEquipmentInput) input: RoomEquipmentInput,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.equipmentService.removeFromRoom(
      ctx.user,
      input.roomId,
      input.equipmentId,
    );
    return toRoomType(room);
  }
}
