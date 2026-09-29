import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import {
  EmployeeType,
  toEmployeeType,
} from '../../auth/dto/employee-type';
import { AuthService } from '../../auth/services/auth-service';
import { ParticipantType } from '../dto/participant-type';

@Resolver(() => ParticipantType)
export class ParticipantEmployeeFieldResolver {
  private readonly authService = new AuthService();

  @FieldResolver(() => EmployeeType)
  @Authorized()
  async employee(
    @Root() participant: ParticipantType,
    @Ctx() ctx: AppContext,
  ): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(
      participant.employeeId,
      ctx.loaders,
    );
    return toEmployeeType(employee);
  }
}
