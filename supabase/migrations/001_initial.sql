create extension if not exists "uuid-ossp";

create table jobs (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  status text not null default 'queued',
  priority integer default 0,
  payload jsonb not null,
  output_url text,
  error text,
  progress integer default 0,
  worker_id text,
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  source_app text default 'clipforge',
  webhook_url text,
  metadata jsonb default '{}'
);

create index jobs_status_created on jobs(status, created_at);
create index jobs_worker_id on jobs(worker_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger jobs_updated_at
  before update on jobs
  for each row execute function update_updated_at();

create or replace function claim_next_job(p_worker_id text, p_job_types text[])
returns setof jobs as $$
  update jobs
  set
    status = 'processing',
    worker_id = p_worker_id,
    claimed_at = now(),
    started_at = now()
  where id = (
    select id from jobs
    where status = 'queued'
      and (p_job_types is null or type = any(p_job_types))
    order by priority desc, created_at asc
    limit 1
    for update skip locked
  )
  returning *;
$$ language sql;
