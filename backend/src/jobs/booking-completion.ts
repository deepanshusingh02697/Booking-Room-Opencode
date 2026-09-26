import { logger } from '../common/logger';
import { BookingService } from '../modules/bookings/services/booking-service';
import type { Job } from './registry';

const bookingService = new BookingService();

export const bookingCompletionJob: Job = {
  name: 'booking-completion',
  schedule: '* * * * *',
  run: async () => {
    const completed = await bookingService.completeFinishedBookings(new Date());
    for (const booking of completed) {
      logger.info(
        `[booking-completion] Booking ${booking.id} "${booking.title}" marked COMPLETED (ended and checked in).`,
      );
    }
  },
};
