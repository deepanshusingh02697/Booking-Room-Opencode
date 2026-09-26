import { Authorized, Ctx, FieldResolver, Resolver, Root } from 'type-graphql';
import { AppContext } from '../../../common/context';
import { BookingType } from '../../bookings/dto/booking-type';
import { ParticipantType, toParticipantType } from '../dto/participant-type';
import { ParticipantService } from '../services/participant-service';

@Resolver(() => BookingType)
export class BookingParticipantsFieldResolver {
  private readonly participantService = new ParticipantService();

  @FieldResolver(() => [ParticipantType])
  @Authorized()
  async participants(
    @Root() booking: BookingType,
    @Ctx() ctx: AppContext,
  ): Promise<ParticipantType[]> {
    const participants = await this.participantService.listForBooking(
      ctx.user,
      booking.id,
    );
    return participants.map(toParticipantType);
  }
}
