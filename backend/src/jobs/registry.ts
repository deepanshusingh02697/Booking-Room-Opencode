import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../common/logger';
import { bookingCompletionJob } from './booking-completion';
import { noShowReleaseJob } from './no-show-release';

export type Job = {
  name: string;
  schedule: string;
  run: () => Promise<void> | void;
  options?: cron.ScheduleOptions;
};

const scheduledJobs: ScheduledTask[] = [];
const jobRegistry: Job[] = [];

export const registerCronJob = (job: Job) => {
  jobRegistry.push(job);
};

registerCronJob(noShowReleaseJob);
registerCronJob(bookingCompletionJob);

export const startJobs = () => {
  for (const job of jobRegistry) {
    const task = cron.schedule(job.schedule, async () => {
      try {
        await job.run();
      } catch (err) {
        logger.error(`Cron job "${job.name}" failed`, err);
      }
    }, job.options);

    scheduledJobs.push(task);
    logger.info(`Cron job "${job.name}" scheduled on "${job.schedule}"`);
  }
};

export const stopJobs = () => {
  for (const task of scheduledJobs) {
    task.stop();
  }
  scheduledJobs.length = 0;
  logger.info('All cron jobs stopped');
};
