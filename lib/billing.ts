import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';

export interface OrganizationBilling {
  org_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  price_id: string | null;
  current_period_end: string | null;
  trial_end: string | null;
}

export async function getOrganizationBilling(orgId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('organization_billing')
    .select(
      'org_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, trial_end'
    )
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('Billing lookup error:', error.message);
    return null;
  }

  return data as OrganizationBilling | null;
}

export async function upsertOrganizationBilling(
  orgId: string,
  updates: Partial<OrganizationBilling>
) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const payload = {
    org_id: orgId,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('organization_billing')
    .upsert(payload, { onConflict: 'org_id' });

  if (error) {
    console.error('Billing upsert error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function getBillingState(billing: OrganizationBilling | null) {
  if (!billing || !billing.status) {
    return { status: 'inactive', isActive: false, reason: 'No subscription' };
  }

  if (billing.status === 'active') {
    return { status: billing.status, isActive: true };
  }

  if (billing.status === 'trialing') {
    const trialEnd = billing.trial_end ? new Date(billing.trial_end) : null;
    if (trialEnd && trialEnd.getTime() > Date.now()) {
      return { status: billing.status, isActive: true };
    }
    return { status: 'trial_expired', isActive: false, reason: 'Trial expired' };
  }

  return { status: billing.status, isActive: false, reason: 'Payment required' };
}

export function getTrialEndDate(trialDays: number) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + trialDays);
  return now.toISOString();
}

export async function ensureTrialForOrg(orgId: string) {
  const existing = await getOrganizationBilling(orgId);
  if (existing) return existing;

  const trialDays = Number.parseInt(process.env.STRIPE_TRIAL_DAYS || '0', 10);
  if (!Number.isFinite(trialDays) || trialDays <= 0) {
    return null;
  }

  const trialEnd = getTrialEndDate(trialDays);
  await upsertOrganizationBilling(orgId, {
    status: 'trialing',
    trial_end: trialEnd,
    current_period_end: trialEnd,
  });

  return getOrganizationBilling(orgId);
}
