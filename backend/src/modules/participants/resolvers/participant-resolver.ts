import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { BookingType, toBookingType } from '../../bookings/dto/booking-type';
import { BookingService } from '../../bookings/services/booking-service';
import { AddParticipantsInput } from '../dto/add-participants-input';
import { RemoveParticipantInput } from '../dto/remove-participant-input';

@Resolver()
export class ParticipantResolver {
  private readonly bookingService = new BookingService();

  @Mutation(() => BookingType)
  @Authorized()
  async addParticipants(
    @Arg('input', () => AddParticipantsInput) input: AddParticipantsInput,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType> {
    const booking = await this.bookingService.addParticipants(ctx.user, input);
    return toBookingType(booking);
  }

  @Mutation(() => BookingType)
  @Authorized()
  async removeParticipant(
    @Arg('input', () => RemoveParticipantInput) input: RemoveParticipantInput,
    @Ctx() ctx: AppContext,
  ): Promise<BookingType> {
    const booking = await this.bookingService.removeParticipant(ctx.user, input);
    return toBookingType(booking);
  }
}
