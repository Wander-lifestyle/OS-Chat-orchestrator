import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBillingState, getOrganizationBilling } from '@/lib/billing';

export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  }

  const billing = await getOrganizationBilling(orgId);
  const state = getBillingState(billing);

  return NextResponse.json({
    status: state.status,
    is_active: state.isActive,
    trial_end: billing?.trial_end || null,
    current_period_end: billing?.current_period_end || null,
    price_id: billing?.price_id || null,
  });
}
