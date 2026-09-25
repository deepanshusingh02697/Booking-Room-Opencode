import { Field, InputType, Int } from 'type-graphql';
import { IsEnum, IsInt } from 'class-validator';
import { RoomStatus } from '../entities/room';

@InputType()
export class SetRoomStatusInput {
  @Field(() => Int)
  @IsInt({ message: 'Room id must be a whole number.' })
  id: number;

  @Field(() => RoomStatus)
  @IsEnum(RoomStatus, { message: 'Status must be one of the valid room statuses.' })
  status: RoomStatus;
}