import {
  Arg,
  Authorized,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql';
import { AppContext } from '../../../common/context';
import { UserRole } from '../../auth/entities/employee';
import { BookingType, toBookingType } from '../dto/booking-type';
import { CreateBookingInput } from '../dto/create-booking-input';
import { BookingService } from '../services/booking-service';

@Resolver()
export class BookingResolver {
  private readonly bookingService = new BookingService();

  @Query(() => [BookingType])
  @Authorized()
  async myBookings(@Ctx() ctx: AppContext): Promise<BookingType[]> {
    const bookings = await this.bookingService.myBookings(ctx.user);
    return bookings.map(toBookingType);
  }

  @Query(() => [BookingType])
  @Authorized()
  async myMeetings(@Ctx() ctx: AppContext): Promise<BookingType[]> {
    const bookings = await this.bookingService.myMeetings(ctx.user);
    return bookings.map(toBookingType);
  }

  @Query(() => BookingType)
  @Authorized()
  async bookingDetails(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType> {
    const booking = await this.bookingService.getById(ctx.user, id);
    return toBookingType(booking);
  }

  @Query(() => [BookingType])
  @Authorized()
  async recurringBookingGroup(
    @Arg('recurrenceId', () => String) recurrenceId: string,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType[]> {
    const bookings = await this.bookingService.recurringBookingGroup(
      ctx.user,
      recurrenceId,
    );
    return bookings.map(toBookingType);
  }

  @Mutation(() => BookingType)
  @Authorized(UserRole.EMPLOYEE)
  async createBooking(
    @Arg('input', () => CreateBookingInput) input: CreateBookingInput,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType> {
    const booking = await this.bookingService.create(ctx.user, {
      roomId: input.roomId,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      participantIds: input.participantIds,
      recurrence: input.recurrence
        ? {
            frequency: input.recurrence.frequency,
            endDate: input.recurrence.endDate,
          }
        : undefined,
    });
    return toBookingType(booking);
  }

  @Mutation(() => BookingType)
  @Authorized()
  async cancelBooking(
    @Arg('id', () => Int) id: number,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType> {
    const booking = await this.bookingService.cancel(ctx.user, id);
    return toBookingType(booking);
  }
}
