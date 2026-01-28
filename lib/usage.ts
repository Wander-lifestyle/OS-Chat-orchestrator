import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';
import { getBillingState, getOrganizationBilling } from '@/lib/billing';

const DEFAULT_FREE_LIMIT = 10;
const DEFAULT_TRIAL_LIMIT = 50;
const DEFAULT_PRO_LIMIT = 500;

function getUsageWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

function getLimitsForStatus(status: string | null) {
  const freeLimit = Number.parseInt(process.env.BRIEF_FREE_LIMIT || '', 10);
  const trialLimit = Number.parseInt(process.env.BRIEF_TRIAL_LIMIT || '', 10);
  const proLimit = Number.parseInt(process.env.BRIEF_PRO_LIMIT || '', 10);

  const resolvedFree = Number.isFinite(freeLimit) ? freeLimit : DEFAULT_FREE_LIMIT;
  const resolvedTrial = Number.isFinite(trialLimit) ? trialLimit : DEFAULT_TRIAL_LIMIT;
  const resolvedPro = Number.isFinite(proLimit) ? proLimit : DEFAULT_PRO_LIMIT;

  if (status === 'active') return resolvedPro;
  if (status === 'trialing') return resolvedTrial;
  return resolvedFree;
}

export async function getBriefUsage(orgId: string) {
  const { start, end } = getUsageWindow();
  const periodStart = start.toISOString().slice(0, 10);
  const periodEnd = new Date(end.getTime() - 1).toISOString().slice(0, 10);

  if (!isSupabaseConfigured()) {
    return {
      count: 0,
      limit: getLimitsForStatus(null),
      periodStart,
      periodEnd,
      status: 'Supabase not configured',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      count: 0,
      limit: getLimitsForStatus(null),
      periodStart,
      periodEnd,
      status: 'Supabase not configured',
    };
  }

  const billing = await getOrganizationBilling(orgId);
  const billingState = getBillingState(billing);
  const limit = getLimitsForStatus(billingState.status);

  const { count, error } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('action', 'brief.created')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  if (error) {
    console.error('Usage query failed:', error.message);
  }

  return {
    count: count || 0,
    limit,
    periodStart,
    periodEnd,
    status: billingState.status,
  };
}
