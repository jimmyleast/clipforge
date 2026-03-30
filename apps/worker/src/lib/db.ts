import { createClient } from '@supabase/supabase-js';
import type { Job } from '@clipforge/shared';
import { logger } from './logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function claimNextJob(workerId: string, types: string[]): Promise<Job | null> {
  const { data, error } = await supabase.rpc('claim_next_job', {
    p_worker_id: workerId,
    p_job_types: types.length > 0 ? types : null,
  });

  if (error) {
    logger.error({ err: error.message }, 'Failed to claim job');
    return null;
  }

  const rows = data as Job[];
  return rows.length > 0 ? rows[0] : null;
}

export async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  await supabase
    .from('jobs')
    .update({ progress })
    .eq('id', jobId);
}

export async function completeJob(jobId: string, outputUrl: string): Promise<void> {
  const { data } = await supabase
    .from('jobs')
    .update({
      status: 'complete',
      output_url: outputUrl,
      progress: 100,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select()
    .single();

  const job = data as Job | null;
  if (job?.webhook_url) {
    fetch(job.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: job.id,
        status: 'complete',
        output_url: job.output_url,
        metadata: job.metadata,
      }),
    }).catch(() => {});
  }
}

export async function failJob(jobId: string, error: string): Promise<void> {
  await supabase
    .from('jobs')
    .update({
      status: 'failed',
      error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}
