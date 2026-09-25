import { Field, InputType, Int } from 'type-graphql';
import { IsInt, IsNotEmpty, MaxLength, Min } from 'class-validator';

@InputType()
export class CreateRoomInput {
  @Field()
  @IsNotEmpty({ message: 'Room name is required.' })
  @MaxLength(100, { message: 'Room name must be at most 100 characters.' })
  name: string;

  @Field(() => Int)
  @IsInt({ message: 'Capacity must be a whole number.' })
  @Min(1, { message: 'Capacity must be at least 1.' })
  capacity: number;

  @Field(() => Int)
  @IsInt({ message: 'Floor must be a whole number.' })
  @Min(0, { message: 'Floor cannot be negative.' })
  floor: number;

  @Field()
  @IsNotEmpty({ message: 'Location is required.' })
  @MaxLength(255, { message: 'Location must be at most 255 characters.' })
  location: string;
}