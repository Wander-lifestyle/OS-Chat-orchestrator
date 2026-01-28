import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ logs: [] });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ logs: [] });
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, details, created_at, user_id')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data || [] });
}
