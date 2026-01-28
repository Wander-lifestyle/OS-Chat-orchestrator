import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { canManageOrganization } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import {
  getOrganizationIntegration,
  upsertOrganizationIntegration,
} from '@/lib/integrations/store';

export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = auth();

  if (!orgId) {
    return NextResponse.json({ error: 'Organization required' }, { status: 400 });
  }

  const record = await getOrganizationIntegration(orgId);
  return NextResponse.json({
    connected: Boolean(record?.slack_access_token),
    channel_id: record?.slack_channel_id || null,
    team_id: record?.slack_team_id || null,
  });
}

export async function POST(request: Request) {
  const { orgId, userId, orgRole } = auth();

  if (!orgId || !userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!canManageOrganization(orgRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const body = await request.json();
  const { access_token, channel_id, team_id } = body || {};
  const existing = await getOrganizationIntegration(orgId);
  const resolvedToken = access_token || existing?.slack_access_token;

  if (!resolvedToken || !channel_id) {
    return NextResponse.json(
      { error: 'access_token and channel_id are required' },
      { status: 400 }
    );
  }

  const result = await upsertOrganizationIntegration(orgId, {
    slack_access_token: resolvedToken,
    slack_channel_id: channel_id,
    slack_team_id: team_id || null,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await logAuditEvent({
    orgId,
    userId,
    action: 'integration.slack.connected',
    details: { channel_id, team_id },
  });

  return NextResponse.json({ connected: true });
}
