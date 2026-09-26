import { Field, InputType, Int } from 'type-graphql';
import { IsInt, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

@InputType()
export class UpdateEquipmentInput {
  @Field(() => Int)
  @IsInt({ message: 'Equipment id must be a whole number.' })
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty({ message: 'Equipment name cannot be empty.' })
  @MaxLength(100, { message: 'Equipment name must be at most 100 characters.' })
  name?: string;
}
