import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { canManageOrganization } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { getOrganizationIntegration } from '@/lib/integrations/store';
import { postSlackMessage } from '@/lib/integrations/slack';

export const runtime = 'nodejs';

export async function POST() {
  const { orgId, userId, orgRole } = auth();

  if (!orgId || !userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!canManageOrganization(orgRole)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const integration = await getOrganizationIntegration(orgId);
  if (!integration?.slack_access_token || !integration?.slack_channel_id) {
    return NextResponse.json(
      { error: 'Slack integration is not configured' },
      { status: 400 }
    );
  }

  const result = await postSlackMessage({
    token: integration.slack_access_token,
    channel: integration.slack_channel_id,
    text: 'OS Brief test: Slack connection is live.',
  });

  await logAuditEvent({
    orgId,
    userId,
    action: 'integration.slack.tested',
    details: { success: result.success, error: result.error },
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
