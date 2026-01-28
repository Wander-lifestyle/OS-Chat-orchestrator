import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBriefUsage } from '@/lib/usage';

export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  }

  const usage = await getBriefUsage(orgId);
  return NextResponse.json(usage);
}
