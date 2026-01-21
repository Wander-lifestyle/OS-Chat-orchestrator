import { supabase, isSupabaseConfigured } from '@/lib/db/client';
import { CreateBriefInput, BriefResult } from '@/types';
import { createCampaign, updateCampaign } from './ledger';

export async function createBrief(input: CreateBriefInput): Promise<BriefResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      name: input.name,
      objective: input.objective,
      target_audience: input.target_audience,
      core_message: input.core_message,
      key_benefits: input.key_benefits || [],
      channels: input.channels || ['email'],
    })
    .select('id, brief_id, name')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create brief: ${error?.message || 'Unknown error'}`);
  }

  let ledgerId = input.ledger_id;
  if (!ledgerId) {
    ledgerId = await createCampaign({
      project_name: input.name,
      brief_id: data.brief_id,
      owner_name: input.owner_name,
      channels: input.channels || ['email'],
      status: 'intake',
      metadata: {
        brief_uuid: data.id,
      },
    });
  } else {
    await updateCampaign({
      ledger_id: ledgerId,
      brief_id: data.brief_id,
      metadata: {
        brief_uuid: data.id,
      },
    });
  }

  return {
    brief_id: data.brief_id,
    uuid: data.id,
    status: 'created',
    name: data.name,
    ledger_id: ledgerId,
  };
}
