import { randomUUID } from 'crypto';
import { claimNextJob, completeJob, failJob } from './lib/db';
import { processJob } from './processors';
import { logger } from './lib/logger';
import { cleanup } from './lib/ffmpeg';

const WORKER_ID = `${process.env.WORKER_ID || 'worker'}-${randomUUID().slice(0, 8)}`;
const POLL_INTERVAL = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '2000');
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '2');
const JOB_TYPES = (process.env.WORKER_JOB_TYPES || '').split(',').filter(Boolean);

let activeJobs = 0;

async function poll() {
  while (activeJobs < CONCURRENCY) {
    const job = await claimNextJob(WORKER_ID, JOB_TYPES);
    if (!job) break;

    activeJobs++;
    logger.info({ jobId: job.id, type: job.type }, 'Job claimed');

    processJob(job)
      .then((outputUrl) => completeJob(job.id, outputUrl))
      .catch((err) => {
        logger.error({ jobId: job.id, err: err.message }, 'Job failed');
        return failJob(job.id, err.message);
      })
      .finally(() => {
        cleanup(job.id);
        activeJobs--;
      });
  }
}

logger.info({ workerId: WORKER_ID, concurrency: CONCURRENCY, types: JOB_TYPES }, 'Worker started');
setInterval(poll, POLL_INTERVAL);
poll();
