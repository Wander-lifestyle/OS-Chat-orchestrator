import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { upsertBillingForOrg } from '@/lib/billing';

export const runtime = 'nodejs';

function toIso(timestamp: number | null | undefined) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

async function handleSubscriptionUpdate(subscription: {
  id: string;
  customer: string;
  status: string;
  items: { data: Array<{ price: { id: string } }> };
  current_period_end?: number | null;
  trial_end?: number | null;
  metadata?: Record<string, string>;
}) {
  const orgId = subscription.metadata?.orgId;
  if (!orgId) return;
  await upsertBillingForOrg({
    orgId,
    stripeCustomerId: String(subscription.customer),
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price?.id ?? null,
    currentPeriodEnd: toIso(subscription.current_period_end ?? null),
    trialEnd: toIso(subscription.trial_end ?? null),
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook secret missing.' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Stripe signature missing.' }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error('Stripe webhook signature error:', error);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          subscription?: string;
        };
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as {
          id: string;
          customer: string;
          status: string;
          items: { data: Array<{ price: { id: string } }> };
          current_period_end?: number | null;
          trial_end?: number | null;
          metadata?: Record<string, string>;
        };
        await handleSubscriptionUpdate(subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handling failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
