import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';
import { CampaignResult, UpdateCampaignInput } from '@/types/index';

function generateLedgerId() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `LED-${date}-${random}`;
}

export async function createCampaign(input: {
  project_name: string;
  brief_id?: string;
  owner_name?: string;
  channels?: string[];
  status?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const ledgerId = generateLedgerId();
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.from('campaigns').insert({
    ledger_id: ledgerId,
    project_name: input.project_name,
    brief_id: input.brief_id || null,
    status: input.status || 'intake',
    owner_name: input.owner_name || 'Editorial OS',
    channels: input.channels || [],
    created_at: now,
    updated_at: now,
    metadata: input.metadata || {},
  });

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return ledgerId;
}

export async function updateCampaign(
  input: UpdateCampaignInput
): Promise<CampaignResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.brief_id) updateData.brief_id = input.brief_id;
  if (input.status) updateData.status = input.status;

  if (input.metadata) {
    const { data: existing } = await supabase
      .from('campaigns')
      .select('metadata')
      .eq('ledger_id', input.ledger_id)
      .single();

    updateData.metadata = {
      ...(existing?.metadata || {}),
      ...input.metadata,
    };
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('ledger_id', input.ledger_id)
    .select('ledger_id, status')
    .single();

  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`);
  }

  return {
    ledger_id: data.ledger_id,
    status: data.status,
    updated: true,
  };
}
