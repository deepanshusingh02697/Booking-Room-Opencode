import { Field, InputType } from 'type-graphql';
import { IsNotEmpty, MaxLength } from 'class-validator';

@InputType()
export class CreateEquipmentInput {
  @Field()
  @IsNotEmpty({ message: 'Equipment name is required.' })
  @MaxLength(100, { message: 'Equipment name must be at most 100 characters.' })
  name: string;
}
