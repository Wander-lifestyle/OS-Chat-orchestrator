import { NextRequest, NextResponse } from 'next/server';
import { runEditorialAgent, type AgentTrack } from '@/lib/agent-runner';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_TRACKS = new Set<AgentTrack>([
  'newsletter',
  'social',
  'press_release',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

type RunEditorialRequest = {
  message?: unknown;
  clientId?: unknown;
  track?: unknown;
};

const toMessage = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toAgentTrack = (value: unknown): AgentTrack | null => {
  if (value === undefined || value === null) {
    return 'newsletter';
  }
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return ALLOWED_TRACKS.has(normalized as AgentTrack)
    ? (normalized as AgentTrack)
    : null;
};

const toClientId = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const withCors = (response: NextResponse) => {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

const jsonResponse = (
  body: Record<string, unknown>,
  init?: { status?: number }
) => withCors(NextResponse.json(body, init));

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  let payload: RunEditorialRequest;

  try {
    payload = await request.json();
  } catch (error) {
    console.error('Editorial OS bridge: invalid JSON', error);
    return jsonResponse(
      { status: 'error', response: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return jsonResponse(
      { status: 'error', response: 'Request body must be a JSON object.' },
      { status: 400 }
    );
  }

  const message = toMessage(payload.message);
  const clientId = toClientId(payload.clientId);
  const track = toAgentTrack(payload.track);

  if (!message) {
    return jsonResponse(
      { status: 'error', response: 'message must be a non-empty string.' },
      { status: 400 }
    );
  }

  if (!track) {
    return jsonResponse(
      {
        status: 'error',
        response: 'track must be one of: newsletter, social, press_release.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await runEditorialAgent({
      message,
      clientId,
      track,
    });

    return jsonResponse({
      status: 'success',
      response: result.response,
      tools: result.tools,
      records: result.records,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Anthropic request failed.';
    console.error('Editorial OS bridge: request failed', error);
    return jsonResponse({ status: 'error', response: message }, { status: 500 });
  }
}
