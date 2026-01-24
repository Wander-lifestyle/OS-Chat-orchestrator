import { NextRequest, NextResponse } from 'next/server';
import { getCampaignLedger, getClientConfig } from '@/app/lib/tool-runtime';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const trackId = request.nextUrl.searchParams.get('trackId') || undefined;
    const clientId = request.nextUrl.searchParams.get('clientId') || undefined;
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || undefined;

    const clientConfig =
      clientId || workspaceId
        ? await getClientConfig({ clientId, workspaceId })
        : null;

    const result = await getCampaignLedger(trackId, clientConfig || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Ledger Fetch Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
