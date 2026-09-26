import { Field, Int, ObjectType } from 'type-graphql';
import { EmployeeType } from '../../auth/dto/employee-type';
import { RoomType } from '../../rooms/dto/room-type';
import { WaitlistEntry } from '../entities/waitlist-entry';

@ObjectType()
export class WaitlistEntryType {
  @Field()
  id: number;

  @Field(() => Int)
  roomId: number;

  @Field(() => Int)
  employeeId: number;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field()
  createdAt: Date;

  @Field(() => RoomType)
  room?: RoomType;

  @Field(() => EmployeeType)
  employee?: EmployeeType;
}

export const toWaitlistEntryType = (
  entry: WaitlistEntry,
): WaitlistEntryType => ({
  id: entry.id,
  roomId: entry.roomId,
  employeeId: entry.employeeId,
  startTime: entry.startTime,
  endTime: entry.endTime,
  createdAt: entry.createdAt,
});
