import { Field, InputType, Int } from 'type-graphql';
import { IsInt } from 'class-validator';

@InputType()
export class RoomEquipmentInput {
  @Field(() => Int)
  @IsInt({ message: 'Room id must be a whole number.' })
  roomId: number;

  @Field(() => Int)
  @IsInt({ message: 'Equipment id must be a whole number.' })
  equipmentId: number;
}
