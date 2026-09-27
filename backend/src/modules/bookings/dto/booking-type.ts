import { Field, Int, ObjectType } from 'type-graphql';
import { EmployeeType } from '../../auth/dto/employee-type';
import { CheckInType } from '../../checkin/dto/check-in-type';
import { checkInWindowEnd } from '../../checkin/utils/check-in-window';
import { ParticipantType } from '../../participants/dto/participant-type';
import { RoomType } from '../../rooms/dto/room-type';
import { Booking, BookingStatus } from '../entities/booking';

@ObjectType()
export class BookingType {
  @Field()
  id: number;

  @Field(() => Int)
  roomId: number;

  @Field(() => Int)
  organizerId: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => BookingStatus)
  status: BookingStatus;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field({ nullable: true })
  recurrenceId?: string;

  @Field()
  hasCheckedIn?: boolean;

  @Field(() => CheckInType, { nullable: true })
  checkIn?: CheckInType;

  /**
   * The bounds of the check-in window, published so a client never has to
   * mirror `CHECK_IN_WINDOW_MINUTES` (FR-39). Both are plain mapped scalars
   * derived from `startTime` — deliberately not field resolvers — so selecting
   * them costs no extra query and cannot introduce an N+1 on a list.
   */
  @Field()
  checkInWindowOpensAt: Date;

  @Field()
  checkInWindowClosesAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => RoomType)
  room?: RoomType;

  @Field(() => EmployeeType)
  organizer?: EmployeeType;

  @Field(() => [ParticipantType])
  participants?: ParticipantType[];
}

export const toBookingType = (booking: Booking): BookingType => ({
  id: booking.id,
  roomId: booking.roomId,
  organizerId: booking.organizerId,
  title: booking.title,
  description: booking.description ?? undefined,
  status: booking.status,
  startTime: booking.startTime,
  endTime: booking.endTime,
  recurrenceId: booking.recurrenceId ?? undefined,
  checkInWindowOpensAt: booking.startTime,
  checkInWindowClosesAt: checkInWindowEnd(booking.startTime),
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
});
