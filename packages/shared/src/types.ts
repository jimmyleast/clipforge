export type JobType =
  | 'text_overlay'
  | 'caption_burn'
  | 'audio_dub'
  | 'trim'
  | 'concat'
  | 'ad_creative';

export type JobStatus = 'queued' | 'processing' | 'complete' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  output_url: string | null;
  error: string | null;
  progress: number;
  worker_id: string | null;
  claimed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  source_app: string;
  webhook_url: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateJobInput {
  type: JobType;
  payload: Record<string, unknown>;
  priority?: number;
  webhook_url?: string;
  metadata?: Record<string, unknown>;
}
