import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getStripeClient } from '@/lib/stripe';
import {
  getOrganizationBilling,
  upsertOrganizationBilling,
  getTrialEndDate,
} from '@/lib/billing';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { orgId, userId } = auth();

  if (!orgId || !userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const priceId = body?.price_id || process.env.STRIPE_PRICE_MONTHLY_ID;

  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price is not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const user = await currentUser();
  const billing = await getOrganizationBilling(orgId);

  let customerId = billing?.stripe_customer_id || null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.emailAddresses?.[0]?.emailAddress || undefined,
      metadata: {
        org_id: orgId,
        user_id: userId,
      },
    });
    customerId = customer.id;
    await upsertOrganizationBilling(orgId, {
      stripe_customer_id: customerId,
      status: 'trialing',
      trial_end: getTrialEndDate(Number(process.env.STRIPE_TRIAL_DAYS || 7)),
      price_id: priceId,
    });
  }

  const trialDays = Number.parseInt(process.env.STRIPE_TRIAL_DAYS || '0', 10);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?success=1`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    subscription_data: {
      trial_period_days: Number.isFinite(trialDays) && trialDays > 0 ? trialDays : undefined,
      metadata: { org_id: orgId },
    },
    metadata: { org_id: orgId },
  });

  return NextResponse.json({ url: session.url });
}
