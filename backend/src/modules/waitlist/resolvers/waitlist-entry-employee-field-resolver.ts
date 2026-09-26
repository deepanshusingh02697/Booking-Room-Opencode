import { Authorized, FieldResolver, Resolver, Root } from 'type-graphql';
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
  async employee(@Root() entry: WaitlistEntryType): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(entry.employeeId);
    return toEmployeeType(employee);
  }
}
