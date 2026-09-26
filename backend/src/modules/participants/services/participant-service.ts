import { AuthUser } from '../../../common/context';
import { UnauthenticatedError } from '../../../common/errors';
import { Participant } from '../entities/participant';
import { ParticipantRepository } from '../repositories/participant-repository';

export class ParticipantService {
  private readonly participantRepository = new ParticipantRepository();

  async listForBooking(
    user: AuthUser | null,
    bookingId: number,
  ): Promise<Participant[]> {
    this.requireAuthenticated(user);
    return this.participantRepository.listForBooking(bookingId);
  }

  private requireAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthenticatedError();
    }
  }
}
