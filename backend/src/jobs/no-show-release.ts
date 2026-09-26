import { logger } from '../common/logger';
import { CheckInService } from '../modules/checkin/services/check-in-service';
import type { Job } from './registry';

const checkInService = new CheckInService();

export const noShowReleaseJob: Job = {
  name: 'no-show-release',
  schedule: '* * * * *',
  run: async () => {
    const released = await checkInService.releaseNoShows(new Date());
    for (const booking of released) {
      logger.info(
        `[no-show-release] Booking ${booking.id} "${booking.title}" released as NO_SHOW (no check-in within 10 minutes of start).`,
      );
    }
  },
};
