import { NextRequest, NextResponse } from 'next/server';
import { jobTypeSchemas } from '@clipforge/shared';
import { enqueueJob, listJobs } from '@/lib/queue';

function authenticate(req: NextRequest): boolean {
  const key = req.headers.get('x-clipforge-key');
  return key === process.env.CLIPFORGE_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { type, payload, priority, webhook_url, metadata } = body;

  if (!type || !payload) {
    return NextResponse.json({ error: 'Missing type or payload' }, { status: 400 });
  }

  const schema = jobTypeSchemas[type as keyof typeof jobTypeSchemas];
  if (!schema) {
    return NextResponse.json({ error: `Unknown job type: ${type}` }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const job = await enqueueJob({
    type,
    payload: parsed.data as Record<string, unknown>,
    priority,
    webhook_url,
    metadata,
  });

  return NextResponse.json(
    { id: job.id, status: job.status, created_at: job.created_at },
    { status: 201 },
  );
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const jobs = await listJobs(limit);
  return NextResponse.json(jobs);
}
