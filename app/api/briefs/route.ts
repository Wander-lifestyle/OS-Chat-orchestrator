import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createBrief } from '@/lib/tools/brief';
import { canManageOrganization } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/db/client';
import { logAuditEvent } from '@/lib/audit';
import { getOrganizationIntegration } from '@/lib/integrations/store';
import { createNotionBriefPage } from '@/lib/integrations/notion';
import { postSlackMessage } from '@/lib/integrations/slack';
import { getBriefUsage } from '@/lib/usage';
import {
  ensureTrialForOrg,
  getBillingState,
  getOrganizationBilling,
} from '@/lib/billing';

export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ briefs: [] });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ briefs: [] });
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .select('created_at, details')
    .eq('org_id', orgId)
    .eq('action', 'brief.created')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ briefs: [], error: error.message }, { status: 500 });
  }

  const briefs =
    data?.map((row) => {
      const details = (row.details || {}) as Record<string, any>;
      return {
        brief_id: details.brief_id,
        brief_uuid: details.brief_uuid,
        name: details.brief_name,
        created_at: row.created_at,
        download_url: `/api/briefs/${details.brief_id || details.brief_uuid}/download`,
        ledger_id: details.ledger_id,
      };
    }) || [];

  return NextResponse.json({ briefs });
}

export async function POST(request: Request) {
  const { orgId, userId, orgRole } = auth();

  if (!orgId || !userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!canManageOrganization(orgRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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

  const usage = await getBriefUsage(orgId);
  if (usage.count >= usage.limit) {
    return NextResponse.json(
      { error: 'Usage limit reached. Upgrade to continue.' },
      { status: 429 }
    );
  }

  const billing = process.env.STRIPE_SECRET_KEY
    ? await ensureTrialForOrg(orgId)
    : await getOrganizationBilling(orgId);
  const billingState = getBillingState(billing);
  if (process.env.STRIPE_SECRET_KEY && !billingState.isActive) {
    return NextResponse.json(
      { error: 'Billing required to create new briefs.', billing_status: billingState.status },
      { status: 402 }
    );
  }

  const body = await request.json();
  const {
    name,
    objective,
    target_audience,
    core_message,
    key_benefits,
    channels,
  } = body || {};

  if (!name || !objective || !target_audience || !core_message) {
    return NextResponse.json(
      { error: 'name, objective, target_audience, and core_message are required' },
      { status: 400 }
    );
  }

  try {
    const user = await currentUser();
    const briefResult = await createBrief({
      name,
      objective,
      target_audience,
      core_message,
      key_benefits,
      channels,
      owner_name: user?.fullName || user?.firstName || 'OS Brief',
    });

    const { data: briefRow, error: briefError } = await supabase
      .from('briefs')
      .select(
        'id, brief_id, name, objective, target_audience, core_message, key_benefits, channels'
      )
      .eq('id', briefResult.uuid)
      .single();

    if (briefError || !briefRow) {
      throw new Error(briefError?.message || 'Failed to load brief');
    }

    await logAuditEvent({
      orgId,
      userId,
      action: 'brief.created',
      details: {
        brief_id: briefRow.brief_id,
        brief_uuid: briefRow.id,
        brief_name: briefRow.name,
        ledger_id: briefResult.ledger_id,
      },
    });

    const integration = await getOrganizationIntegration(orgId);

    let notionResult = { success: false, error: 'Not connected' } as {
      success: boolean;
      page_url?: string;
      error?: string;
    };

    if (integration?.notion_access_token && integration?.notion_database_id) {
      const notionResponse = await createNotionBriefPage({
        token: integration.notion_access_token,
        databaseId: integration.notion_database_id,
        brief: briefRow,
      });

      notionResult = {
        success: notionResponse.success,
        page_url: notionResponse.url,
        error: notionResponse.error,
      };

      await logAuditEvent({
        orgId,
        userId,
        action: 'brief.notion_archived',
        details: {
          brief_id: briefRow.brief_id,
          brief_uuid: briefRow.id,
          success: notionResponse.success,
          page_url: notionResponse.url,
          error: notionResponse.error,
        },
      });
    }

    let slackResult = { success: false, error: 'Not connected' } as {
      success: boolean;
      error?: string;
    };

    if (integration?.slack_access_token && integration?.slack_channel_id) {
      const slackMessage = [
        `:memo: New brief created: *${briefRow.name}* (${briefRow.brief_id})`,
        `Objective: ${briefRow.objective}`,
        `Audience: ${briefRow.target_audience}`,
        `Core message: ${briefRow.core_message}`,
        notionResult.page_url ? `Notion: ${notionResult.page_url}` : undefined,
      ]
        .filter(Boolean)
        .join('\n');

      const slackResponse = await postSlackMessage({
        token: integration.slack_access_token,
        channel: integration.slack_channel_id,
        text: slackMessage,
      });

      slackResult = slackResponse;

      await logAuditEvent({
        orgId,
        userId,
        action: 'brief.slack_notified',
        details: {
          brief_id: briefRow.brief_id,
          brief_uuid: briefRow.id,
          success: slackResponse.success,
          error: slackResponse.error,
        },
      });
    }

    return NextResponse.json({
      brief: briefRow,
      ledger_id: briefResult.ledger_id,
      download_url: `/api/briefs/${briefRow.brief_id}/download`,
      notion: notionResult,
      slack: slackResult,
    });
  } catch (error) {
    console.error('Brief creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create brief' },
      { status: 500 }
    );
  }
}
