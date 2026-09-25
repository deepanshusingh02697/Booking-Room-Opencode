import { Field, ObjectType } from 'type-graphql';
import { Employee, UserRole } from '../entities/employee';

@ObjectType()
export class EmployeeType {
  @Field()
  id: number;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field(() => UserRole)
  role: UserRole;
}

export const toEmployeeType = (employee: Employee): EmployeeType => ({
  id: employee.id,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  role: employee.role,
});
