import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { AppContext } from '../../../common/context';
import { UserRole } from '../../auth/entities/employee';
import { CreateRoomInput } from '../dto/create-room-input';
import { RoomFilterInput } from '../dto/room-filter-input';
import { RoomType, toRoomType } from '../dto/room-type';
import { SetRoomStatusInput } from '../dto/set-room-status-input';
import { UpdateRoomInput } from '../dto/update-room-input';
import { RoomService } from '../services/room-service';

@Resolver()
export class RoomResolver {
  private readonly roomService = new RoomService();

  @Query(() => [RoomType])
  @Authorized()
  async rooms(
    @Arg('filter', () => RoomFilterInput, { nullable: true })
    filter: RoomFilterInput | undefined,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType[]> {
    const rooms = await this.roomService.search(ctx.user, filter);
    return rooms.map(toRoomType);
  }

  @Query(() => RoomType)
  @Authorized()
  async room(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.getById(ctx.user, id);
    return toRoomType(room);
  }

  @Mutation(() => RoomType)
  @Authorized(UserRole.ADMIN)
  async createRoom(
    @Arg('input', () => CreateRoomInput) input: CreateRoomInput,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.create(ctx.user, input);
    return toRoomType(room);
  }

  @Mutation(() => RoomType)
  @Authorized(UserRole.ADMIN)
  async updateRoom(
    @Arg('input', () => UpdateRoomInput) input: UpdateRoomInput,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.update(ctx.user, input.id, {
      name: input.name,
      capacity: input.capacity,
      floor: input.floor,
      location: input.location,
    });
    return toRoomType(room);
  }

  @Mutation(() => RoomType)
  @Authorized(UserRole.ADMIN)
  async setRoomStatus(
    @Arg('input', () => SetRoomStatusInput) input: SetRoomStatusInput,
    @Ctx() ctx: AppContext,
  ): Promise<RoomType> {
    const room = await this.roomService.setStatus(ctx.user, input.id, input.status);
    return toRoomType(room);
  }
}