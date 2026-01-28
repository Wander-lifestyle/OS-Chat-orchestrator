import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripeClient } from '@/lib/stripe';
import { getOrganizationBilling } from '@/lib/billing';

export const runtime = 'nodejs';

export async function POST() {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const billing = await getOrganizationBilling(orgId);
  if (!billing?.stripe_customer_id) {
    return NextResponse.json({ error: 'Billing not set up' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}
