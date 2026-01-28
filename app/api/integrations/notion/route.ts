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
    connected: Boolean(record?.notion_access_token),
    workspace_id: record?.notion_workspace_id || null,
    database_id: record?.notion_database_id || null,
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
  const { access_token, database_id, workspace_id } = body || {};
  const existing = await getOrganizationIntegration(orgId);
  const resolvedToken = access_token || existing?.notion_access_token;

  if (!resolvedToken || !database_id) {
    return NextResponse.json(
      { error: 'access_token and database_id are required' },
      { status: 400 }
    );
  }

  const result = await upsertOrganizationIntegration(orgId, {
    notion_access_token: resolvedToken,
    notion_database_id: database_id,
    notion_workspace_id: workspace_id || null,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await logAuditEvent({
    orgId,
    userId,
    action: 'integration.notion.connected',
    details: { database_id, workspace_id },
  });

  return NextResponse.json({ connected: true });
}
