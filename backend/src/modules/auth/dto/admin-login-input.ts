import { Field, InputType } from 'type-graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class AdminLoginInput {
  @Field()
  @IsEmail({}, { message: 'A valid email address is required.' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
