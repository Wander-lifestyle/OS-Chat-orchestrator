import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { briefId: string } }
) {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 }
    );
  }

  const { briefId } = params;
  const isFriendlyId = briefId.toUpperCase().startsWith('BRF-');

  const auditQuery = supabase
    .from('audit_logs')
    .select('id')
    .eq('org_id', orgId)
    .eq('action', 'brief.created');

  const auditResult = isFriendlyId
    ? await auditQuery.filter('details->>brief_id', 'eq', briefId).maybeSingle()
    : await auditQuery.filter('details->>brief_uuid', 'eq', briefId).maybeSingle();

  if (!auditResult.data) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const { data: brief, error } = await supabase
    .from('briefs')
    .select(
      'brief_id, name, objective, target_audience, core_message, key_benefits, channels, created_at'
    )
    .eq(isFriendlyId ? 'brief_id' : 'id', briefId)
    .single();

  if (error || !brief) {
    return NextResponse.json(
      { error: error?.message || 'Brief not found' },
      { status: 404 }
    );
  }

  const lines = [
    `# ${brief.name}`,
    ``,
    `Brief ID: ${brief.brief_id}`,
    `Created: ${new Date(brief.created_at).toISOString()}`,
    ``,
    `## Objective`,
    brief.objective,
    ``,
    `## Target Audience`,
    brief.target_audience,
    ``,
    `## Core Message`,
    brief.core_message,
    ``,
    `## Channels`,
    (brief.channels || []).join(', ') || 'Not specified',
    ``,
  ];

  if (brief.key_benefits && brief.key_benefits.length > 0) {
    lines.push(`## Key Benefits`);
    brief.key_benefits.forEach((benefit: string) => {
      lines.push(`- ${benefit}`);
    });
    lines.push('');
  }

  const content = lines.join('\n');
  const filename = `${brief.brief_id || 'brief'}.md`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
