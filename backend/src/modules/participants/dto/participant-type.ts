import { Field, Int, ObjectType } from 'type-graphql';
import { EmployeeType } from '../../auth/dto/employee-type';
import { Participant } from '../entities/participant';

@ObjectType()
export class ParticipantType {
  @Field()
  id: number;

  @Field(() => Int)
  bookingId: number;

  @Field(() => Int)
  employeeId: number;

  @Field()
  createdAt: Date;

  @Field(() => EmployeeType)
  employee?: EmployeeType;
}

export const toParticipantType = (
  participant: Participant,
): ParticipantType => ({
  id: participant.id,
  bookingId: participant.bookingId,
  employeeId: participant.employeeId,
  createdAt: participant.createdAt,
});
