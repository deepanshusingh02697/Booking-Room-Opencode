import { Field, Int, ObjectType } from 'type-graphql';
import { EmployeeType } from '../../auth/dto/employee-type';
import { CheckIn } from '../entities/check-in';

@ObjectType()
export class CheckInType {
  @Field()
  id: number;

  @Field(() => Int)
  bookingId: number;

  @Field(() => Int)
  checkedInBy: number;

  @Field()
  checkedInAt: Date;

  @Field()
  createdAt: Date;

  @Field(() => EmployeeType)
  employee?: EmployeeType;
}

export const toCheckInType = (checkIn: CheckIn): CheckInType => ({
  id: checkIn.id,
  bookingId: checkIn.bookingId,
  checkedInBy: checkIn.checkedInBy,
  checkedInAt: checkIn.checkedInAt,
  createdAt: checkIn.createdAt,
});
