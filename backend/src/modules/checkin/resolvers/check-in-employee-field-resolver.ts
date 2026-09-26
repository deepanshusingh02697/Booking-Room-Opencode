import { Authorized, FieldResolver, Resolver, Root } from 'type-graphql';
import {
  EmployeeType,
  toEmployeeType,
} from '../../auth/dto/employee-type';
import { AuthService } from '../../auth/services/auth-service';
import { CheckInType } from '../dto/check-in-type';

@Resolver(() => CheckInType)
export class CheckInEmployeeFieldResolver {
  private readonly authService = new AuthService();

  @FieldResolver(() => EmployeeType)
  @Authorized()
  async employee(@Root() checkIn: CheckInType): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(checkIn.checkedInBy);
    return toEmployeeType(employee);
  }
}
