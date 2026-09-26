import { Field, InputType, Int } from 'type-graphql';
import { IsInt, Min } from 'class-validator';

@InputType()
export class RemoveParticipantInput {
  @Field(() => Int)
  @IsInt({ message: 'Booking id must be a whole number.' })
  @Min(1, { message: 'Booking id must be at least 1.' })
  bookingId: number;

  @Field(() => Int)
  @IsInt({ message: 'Employee id must be a whole number.' })
  @Min(1, { message: 'Employee id must be at least 1.' })
  employeeId: number;
}
