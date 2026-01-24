import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Lightweight health check for uptime probes.
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
