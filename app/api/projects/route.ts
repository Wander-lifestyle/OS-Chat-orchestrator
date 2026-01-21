import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ projects: [] });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ projects: [] });
  }

  const { data, error } = await supabase
    .from('campaigns')
    .select('ledger_id, project_name, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ projects: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data || [] });
}
