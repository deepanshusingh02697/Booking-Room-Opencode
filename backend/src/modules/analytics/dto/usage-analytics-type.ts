import { Field, Int, ObjectType } from 'type-graphql';
import type { RoomUsage } from '../repositories/analytics-repository';

@ObjectType()
export class UsageAnalyticsType {
  @Field(() => Int)
  roomId: number;

  @Field()
  roomName: string;

  @Field(() => Int)
  totalBookings: number;

  @Field(() => Int)
  cancellations: number;

  @Field(() => Int)
  noShows: number;
}

export const toUsageAnalyticsType = (usage: RoomUsage): UsageAnalyticsType => ({
  roomId: usage.roomId,
  roomName: usage.roomName,
  totalBookings: usage.totalBookings,
  cancellations: usage.cancellations,
  noShows: usage.noShows,
});
