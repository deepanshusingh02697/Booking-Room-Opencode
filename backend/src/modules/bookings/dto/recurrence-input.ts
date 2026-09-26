import { Field, InputType } from 'type-graphql';
import { IsEnum } from 'class-validator';
import { RecurrenceFrequency } from '../utils/recurrence';

@InputType()
export class RecurrenceInput {
  @Field(() => RecurrenceFrequency)
  @IsEnum(RecurrenceFrequency, {
    message: 'Recurrence frequency must be DAILY or WEEKLY.',
  })
  frequency: RecurrenceFrequency;

  @Field()
  endDate: Date;
}
