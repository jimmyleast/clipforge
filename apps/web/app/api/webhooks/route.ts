import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('[webhook received]', body);
  return NextResponse.json({ received: true });
}
