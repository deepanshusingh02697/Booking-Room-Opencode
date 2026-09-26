import { Field, InputType, Int } from 'type-graphql';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

@InputType()
export class AddParticipantsInput {
  @Field(() => Int)
  @IsInt({ message: 'Booking id must be a whole number.' })
  @Min(1, { message: 'Booking id must be at least 1.' })
  bookingId: number;

  @Field(() => [Int])
  @IsArray({ message: 'Employee ids must be a list of numbers.' })
  @ArrayMinSize(1, { message: 'Provide at least one employee id.' })
  @IsInt({ each: true, message: 'Each employee id must be a whole number.' })
  @Min(1, { each: true, message: 'Each employee id must be at least 1.' })
  employeeIds: number[];
}
