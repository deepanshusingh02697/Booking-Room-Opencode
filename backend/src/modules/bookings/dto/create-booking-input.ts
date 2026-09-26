import { Field, InputType, Int } from 'type-graphql';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RecurrenceInput } from './recurrence-input';

@InputType()
export class CreateBookingInput {
  @Field(() => Int)
  @IsInt({ message: 'Room id must be a whole number.' })
  @Min(1, { message: 'Room id must be at least 1.' })
  roomId: number;

  @Field()
  @IsNotEmpty({ message: 'Title is required.' })
  @MaxLength(200, { message: 'Title must be at most 200 characters.' })
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(1000, { message: 'Description must be at most 1000 characters.' })
  description?: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field(() => [Int], { nullable: true })
  @IsOptional()
  @IsArray({ message: 'Participant ids must be a list of numbers.' })
  @IsInt({ each: true, message: 'Each participant id must be a whole number.' })
  participantIds?: number[];

  @Field(() => RecurrenceInput, { nullable: true })
  @IsOptional()
  recurrence?: RecurrenceInput;
}
