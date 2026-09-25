import { Field, InputType } from 'type-graphql';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  @Field()
  @IsNotEmpty({ message: 'First name is required.' })
  @MaxLength(50)
  firstName: string;

  @Field()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MaxLength(50)
  lastName: string;

  @Field()
  @IsEmail({}, { message: 'A valid email address is required.' })
  email: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}
