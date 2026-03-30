import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/queue';

function authenticate(req: NextRequest): boolean {
  const key = req.headers.get('x-clipforge-key');
  return key === process.env.CLIPFORGE_API_KEY;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = await getJob(params.id);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    output_url: job.output_url,
    error: job.error,
    created_at: job.created_at,
    completed_at: job.completed_at,
  });
}
