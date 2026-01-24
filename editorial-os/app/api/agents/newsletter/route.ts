import { NextRequest, NextResponse } from 'next/server';
import { loadAgentSpec } from '@/app/lib/load-agent-spec';
import { runAgentLoop } from '@/app/lib/claude-client';
import { ClientConfig, getClientConfig } from '@/app/lib/tool-runtime';

export const runtime = 'nodejs';

function buildSystemContext({
  clientConfig,
  ledgerDatabaseId,
  briefsDatabaseId,
  trackId,
}: {
  clientConfig?: ClientConfig | null;
  ledgerDatabaseId?: string;
  briefsDatabaseId?: string;
  trackId?: string | number | null;
}) {
  const lines: string[] = ['Runtime Context:'];

  if (ledgerDatabaseId) {
    lines.push(`Ledger Database ID: ${ledgerDatabaseId}`);
  }
  if (briefsDatabaseId) {
    lines.push(`Briefs Database ID: ${briefsDatabaseId}`);
  }
  if (trackId !== undefined && trackId !== null) {
    lines.push(`Track ID: ${trackId}`);
  }

  if (clientConfig?.brandVoice) {
    lines.push('', 'Client Brand Voice:', clientConfig.brandVoice);
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, clientId, workspaceId, trackId } = body || {};

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    const clientConfig = await getClientConfig({
      clientId,
      workspaceId,
    });

    const ledgerDatabaseId =
      clientConfig?.ledgerDatabaseId || process.env.NOTION_LEDGER_DATABASE_ID;
    const briefsDatabaseId =
      clientConfig?.briefsDatabaseId || process.env.NOTION_BRIEFS_DATABASE_ID;

    const systemPrompt = [
      await loadAgentSpec('newsletter-agent'),
      buildSystemContext({
        clientConfig,
        ledgerDatabaseId,
        briefsDatabaseId,
        trackId,
      }),
    ]
      .filter(Boolean)
      .join('\n\n');

    const { finalResponse, toolCalls } = await runAgentLoop(
      systemPrompt,
      userMessage,
      clientConfig || undefined
    );

    const ledgerEntry = toolCalls.find((call) => call.tool === 'create_notion_page');
    let ledgerPageId: string | null = null;
    let ledgerUrl: string | null = null;

    if (ledgerEntry?.result) {
      try {
        const parsed = JSON.parse(ledgerEntry.result);
        ledgerPageId = parsed?.pageId || null;
        ledgerUrl = parsed?.url || null;
      } catch (error) {
        console.error('Failed to parse ledger tool result', error);
      }
    }

    return NextResponse.json({
      success: true,
      agentResponse: finalResponse,
      toolCalls,
      ledgerPageCreated: Boolean(ledgerPageId),
      ledgerPageId,
      ledgerUrl,
    });
  } catch (error: any) {
    console.error('[Newsletter Agent Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
