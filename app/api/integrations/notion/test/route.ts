import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { canManageOrganization } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { getOrganizationIntegration } from '@/lib/integrations/store';
import { testNotionConnection } from '@/lib/integrations/notion';

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
  if (!integration?.notion_access_token || !integration?.notion_database_id) {
    return NextResponse.json(
      { error: 'Notion integration is not configured' },
      { status: 400 }
    );
  }

  const result = await testNotionConnection({
    token: integration.notion_access_token,
    databaseId: integration.notion_database_id,
  });

  await logAuditEvent({
    orgId,
    userId,
    action: 'integration.notion.tested',
    details: { success: result.success, error: result.error },
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, database: result.databaseName });
}
