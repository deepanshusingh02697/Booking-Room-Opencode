import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import {
  EmployeeType,
  toEmployeeType,
} from '../../auth/dto/employee-type';
import { AuthService } from '../../auth/services/auth-service';
import { WaitlistEntryType } from '../dto/waitlist-entry-type';

@Resolver(() => WaitlistEntryType)
export class WaitlistEntryEmployeeFieldResolver {
  private readonly authService = new AuthService();

  @FieldResolver(() => EmployeeType)
  @Authorized()
  async employee(
    @Root() entry: WaitlistEntryType,
    @Ctx() ctx: AppContext,
  ): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(
      entry.employeeId,
      ctx.loaders,
    );
    return toEmployeeType(employee);
  }
}
