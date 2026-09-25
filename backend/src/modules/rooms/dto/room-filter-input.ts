import { Field, InputType, Int } from 'type-graphql';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { RoomStatus } from '../entities/room';

@InputType()
export class RoomFilterInput {
  @Field(() => RoomStatus, { nullable: true })
  @IsOptional()
  @IsEnum(RoomStatus, { message: 'Status must be one of the valid room statuses.' })
  status?: RoomStatus;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Minimum capacity must be a whole number.' })
  @Min(1, { message: 'Minimum capacity must be at least 1.' })
  minCapacity?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt({ message: 'Floor must be a whole number.' })
  floor?: number;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Equipment ids must be a list of numbers.' })
  @IsInt({ each: true, message: 'Each equipment id must be a whole number.' })
  @ArrayMinSize(1, { message: 'Provide at least one equipment id.' })
  equipmentIds?: number[];

  @Field(() => Date, { nullable: true })
  @IsOptional()
  startTime?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  endTime?: Date;
}