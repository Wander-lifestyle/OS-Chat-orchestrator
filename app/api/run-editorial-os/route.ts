import { NextRequest, NextResponse } from 'next/server';
import { runEditorialAgent, type AgentOS } from '@/lib/agent-runner';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_LEVELS = new Set([3, 4, 5]);
const ALLOWED_OS = new Set<AgentOS>(['newsletter', 'social']);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

type RunEditorialRequest = {
  message?: unknown;
  agentLevel?: unknown;
  os?: unknown;
};

const toAgentLevel = (value: unknown): 3 | 4 | 5 | null => {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;
  return ALLOWED_LEVELS.has(numeric as 3 | 4 | 5)
    ? (numeric as 3 | 4 | 5)
    : null;
};

const toMessage = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toAgentOS = (value: unknown): AgentOS | null => {
  if (value === undefined || value === null) {
    return 'newsletter';
  }
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return ALLOWED_OS.has(normalized as AgentOS)
    ? (normalized as AgentOS)
    : null;
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
  const agentLevel = toAgentLevel(payload.agentLevel);
  const agentOS = toAgentOS(payload.os);

  if (!message) {
    return jsonResponse(
      { status: 'error', response: 'message must be a non-empty string.' },
      { status: 400 }
    );
  }

  if (!agentLevel) {
    return jsonResponse(
      { status: 'error', response: 'agentLevel must be 3, 4, or 5.' },
      { status: 400 }
    );
  }

  if (!agentOS) {
    return jsonResponse(
      {
        status: 'error',
        response: 'os must be one of: newsletter, social.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await runEditorialAgent({
      message,
      agentLevel,
      os: agentOS,
    });

    return jsonResponse({
      status: 'success',
      response: result.response,
      tools: result.tools,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Anthropic request failed.';
    console.error('Editorial OS bridge: request failed', error);
    return jsonResponse({ status: 'error', response: message }, { status: 500 });
  }
}
