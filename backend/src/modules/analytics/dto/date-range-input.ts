import { Field, InputType } from 'type-graphql';

@InputType()
export class DateRangeInput {
  @Field()
  startTime: Date;

  @Field()
  endTime: Date;
}
