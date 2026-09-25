import { Field, Int, ObjectType } from 'type-graphql';
import { Room, RoomStatus } from '../entities/room';

@ObjectType()
export class RoomType {
  @Field()
  id: number;

  @Field()
  name: string;

  @Field(() => Int)
  capacity: number;

  @Field(() => Int)
  floor: number;

  @Field()
  location: string;

  @Field(() => RoomStatus)
  status: RoomStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const toRoomType = (room: Room): RoomType => ({
  id: room.id,
  name: room.name,
  capacity: room.capacity,
  floor: room.floor,
  location: room.location,
  status: room.status,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});