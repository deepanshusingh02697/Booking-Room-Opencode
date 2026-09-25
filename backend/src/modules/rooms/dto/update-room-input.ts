import { Field, InputType, Int } from 'type-graphql';
import { IsInt, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';

@InputType()
export class UpdateRoomInput {
  @Field(() => Int)
  @IsInt({ message: 'Room id must be a whole number.' })
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty({ message: 'Room name cannot be empty.' })
  @MaxLength(100, { message: 'Room name must be at most 100 characters.' })
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Capacity must be a whole number.' })
  @Min(1, { message: 'Capacity must be at least 1.' })
  capacity?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Floor must be a whole number.' })
  @Min(0, { message: 'Floor cannot be negative.' })
  floor?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty({ message: 'Location cannot be empty.' })
  @MaxLength(255, { message: 'Location must be at most 255 characters.' })
  location?: string;
}