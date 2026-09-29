import { AuthUser } from '../../../common/context';
import { Loaders } from '../../../common/dataloaders';
import { UnauthenticatedError } from '../../../common/errors';
import { Participant } from '../entities/participant';
import { ParticipantRepository } from '../repositories/participant-repository';

export class ParticipantService {
  private readonly participantRepository = new ParticipantRepository();

  async listForBooking(
    user: AuthUser | null,
    bookingId: number,
    loaders?: Loaders,
  ): Promise<Participant[]> {
    this.requireAuthenticated(user);
    return loaders
      ? loaders.participantsByBookingId.load(bookingId)
      : this.participantRepository.listForBooking(bookingId);
  }

  private requireAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthenticatedError();
    }
  }
}
