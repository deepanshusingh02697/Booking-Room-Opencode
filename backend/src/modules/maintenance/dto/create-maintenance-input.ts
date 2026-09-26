import { Field, InputType, Int } from 'type-graphql';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateMaintenanceInput {
  @Field(() => Int)
  @IsInt({ message: 'Room id must be a whole number.' })
  @Min(1, { message: 'Room id must be at least 1.' })
  roomId: number;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Reason must be a string.' })
  @MaxLength(1000, { message: 'Reason must be at most 1000 characters.' })
  reason?: string;
}
