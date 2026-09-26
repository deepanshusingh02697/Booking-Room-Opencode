import { Authorized, FieldResolver, Resolver, Root } from 'type-graphql';
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
  async employee(@Root() participant: ParticipantType): Promise<EmployeeType> {
    const employee = await this.authService.currentUser(
      participant.employeeId,
    );
    return toEmployeeType(employee);
  }
}
