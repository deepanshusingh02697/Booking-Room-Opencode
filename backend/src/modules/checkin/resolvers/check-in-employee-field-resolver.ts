import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
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
  async employee(
    @Root() checkIn: CheckInType,
    @Ctx() ctx: AppContext,
  ): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(
      checkIn.checkedInBy,
      ctx.loaders,
    );
    return toEmployeeType(employee);
  }
}
