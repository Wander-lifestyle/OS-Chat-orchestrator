import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';

export interface OrganizationIntegrationRecord {
  org_id: string;
  notion_access_token?: string | null;
  notion_workspace_id?: string | null;
  notion_database_id?: string | null;
  slack_access_token?: string | null;
  slack_team_id?: string | null;
  slack_channel_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getOrganizationIntegration(orgId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('organization_integrations')
    .select(
      'org_id, notion_access_token, notion_workspace_id, notion_database_id, slack_access_token, slack_team_id, slack_channel_id'
    )
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('Integration fetch error:', error.message);
    return null;
  }

  return data as OrganizationIntegrationRecord | null;
}

export async function upsertOrganizationIntegration(
  orgId: string,
  updates: Partial<OrganizationIntegrationRecord>
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
    .from('organization_integrations')
    .upsert(payload, { onConflict: 'org_id' });

  if (error) {
    console.error('Integration upsert error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
