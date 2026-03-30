import { getSupabase } from './db';
import type { Job, CreateJobInput } from '@clipforge/shared';

export async function enqueueJob(input: CreateJobInput): Promise<Job> {
  const { data, error } = await getSupabase()
    .from('jobs')
    .insert({
      type: input.type,
      payload: input.payload,
      priority: input.priority ?? 0,
      webhook_url: input.webhook_url ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to enqueue job: ${error.message}`);
  return data as Job;
}

export async function getJob(jobId: string): Promise<Job | null> {
  const { data, error } = await getSupabase()
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) return null;
  return data as Job;
}

export async function listJobs(limit: number = 50): Promise<Job[]> {
  const { data, error } = await getSupabase()
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 200));

  if (error) throw new Error(`Failed to list jobs: ${error.message}`);
  return (data ?? []) as Job[];
}
