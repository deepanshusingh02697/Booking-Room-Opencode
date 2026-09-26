import { Field, Int, ObjectType } from 'type-graphql';
import { RoomType } from '../../rooms/dto/room-type';
import { Maintenance } from '../entities/maintenance';

@ObjectType()
export class MaintenanceType {
  @Field()
  id: number;

  @Field(() => Int)
  roomId: number;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  createdAt: Date;

  @Field(() => RoomType)
  room?: RoomType;
}

export const toMaintenanceType = (
  maintenance: Maintenance,
): MaintenanceType => ({
  id: maintenance.id,
  roomId: maintenance.roomId,
  startTime: maintenance.startTime,
  endTime: maintenance.endTime,
  reason: maintenance.reason ?? undefined,
  createdAt: maintenance.createdAt,
});
