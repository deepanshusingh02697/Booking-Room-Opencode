import { logger } from '../../../common/logger';
import { Booking } from '../../bookings/entities/booking';

export class WaitlistConversionService {
  async onBookingCancelled(booking: Booking): Promise<void> {
    logger.debug(
      `Waitlist conversion is not active for cancelled booking ${booking.id}.`,
    );
  }
}
