import { Field, InputType, Int } from 'type-graphql';
import { IsInt, Min } from 'class-validator';

@InputType()
export class JoinWaitlistInput {
  @Field(() => Int)
  @IsInt({ message: 'Room id must be a whole number.' })
  @Min(1, { message: 'Room id must be at least 1.' })
  roomId: number;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
}
