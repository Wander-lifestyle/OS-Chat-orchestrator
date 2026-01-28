import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';

export async function logAuditEvent({
  orgId,
  userId,
  action,
  details = {},
}: {
  orgId: string;
  userId: string;
  action: string;
  details?: Record<string, unknown>;
}) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  const { error } = await supabase.from('audit_logs').insert({
    org_id: orgId,
    user_id: userId,
    action,
    details,
  });

  if (error) {
    console.error('Audit log error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
