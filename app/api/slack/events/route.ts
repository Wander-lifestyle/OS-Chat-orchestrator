import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { runEditorialAgent, type AgentTrack } from '@/lib/agent-runner';
import { postNotification } from '@/lib/slack';
import { getClientIdForSlackChannel } from '@/lib/client-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SIGNATURE_VERSION = 'v0';
const MAX_AGE_SECONDS = 60 * 5;

const toAgentTrack = (value: unknown): AgentTrack => {
  if (value === 'social') return 'social';
  if (value === 'press_release') return 'press_release';
  return 'newsletter';
};

const verifySlackSignature = (
  signingSecret: string,
  timestamp: string,
  signature: string,
  body: string
) => {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const age = Math.abs(Date.now() / 1000 - ts);
  if (age > MAX_AGE_SECONDS) return false;

  const base = `${SIGNATURE_VERSION}:${timestamp}:${body}`;
  const hash = crypto
    .createHmac('sha256', signingSecret)
    .update(base, 'utf8')
    .digest('hex');
  const expected = `${SIGNATURE_VERSION}=${hash}`;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

const normalizeSlackText = (text: string) =>
  text.replace(/<@[^>]+>/g, '').replace(/^[\s:,.-]+/, '').trim();

const detectTrack = (text: string, fallback: AgentTrack) => {
  if (/\bsocial\b/i.test(text)) {
    return 'social';
  }
  if (/\bpress\b|\bpress release\b/i.test(text)) {
    return 'press_release';
  }
  if (/\bnewsletter\b/i.test(text)) {
    return 'newsletter';
  }
  return fallback;
};

const formatToolSummary = (
  tools: Awaited<ReturnType<typeof runEditorialAgent>>['tools']
) => {
  if (!tools.length) return '';
  const lines = tools.map((tool) => {
    const marker = tool.ok ? '✅' : '⚠️';
    return `${marker} ${tool.name}: ${tool.summary}`;
  });
  return `\n\n*Tool activity:*\n${lines.join('\n')}`;
};

const formatRecordLinks = (
  records: Awaited<ReturnType<typeof runEditorialAgent>>['records']
) => {
  if (!records) return '';
  const lines: string[] = [];
  if (records.outputUrl) {
    lines.push(`• Output: ${records.outputUrl}`);
  }
  if (records.ledgerUrl) {
    lines.push(`• Ledger: ${records.ledgerUrl}`);
  }
  if (!lines.length) return '';
  return `\n\n*Notion links:*\n${lines.join('\n')}`;
};

export async function POST(request: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { error: 'SLACK_SIGNING_SECRET is not configured.' },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get('x-slack-request-timestamp') || '';
  const signature = request.headers.get('x-slack-signature') || '';

  if (!verifySlackSignature(signingSecret, timestamp, signature, rawBody)) {
    return NextResponse.json({ error: 'Invalid Slack signature.' }, { status: 401 });
  }

  const retryNum = request.headers.get('x-slack-retry-num');
  if (retryNum) {
    return NextResponse.json({ ok: true });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('Slack payload parse failed', error);
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }

  if (payload.type !== 'event_callback') {
    return NextResponse.json({ ok: true });
  }

  const event = payload.event || {};
  if (event.type !== 'app_mention' || event.subtype === 'bot_message') {
    return NextResponse.json({ ok: true });
  }

  const text = typeof event.text === 'string' ? event.text : '';
  const cleaned = normalizeSlackText(text);
  if (!cleaned) {
    return NextResponse.json({ ok: true });
  }

  const defaultTrack = toAgentTrack(process.env.SLACK_DEFAULT_TRACK);
  const track = detectTrack(cleaned, defaultTrack);

  const channel = event.channel || process.env.SLACK_DEFAULT_CHANNEL;
  if (!channel) {
    return NextResponse.json(
      { error: 'No Slack channel available for response.' },
      { status: 400 }
    );
  }

  const threadTs = event.thread_ts || event.ts;
  const clientId = getClientIdForSlackChannel(event.channel);

  try {
    const result = await runEditorialAgent({
      message: cleaned,
      clientId,
      track,
    });

    const reply = `${result.response}${formatToolSummary(result.tools)}${formatRecordLinks(result.records)}`;

    await postNotification({
      channel,
      message: reply,
      threadTs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Agent execution failed.';
    console.error('Slack agent execution failed', error);
    await postNotification({
      channel,
      message: `Error: ${message}`,
      threadTs,
    });
  }

  return NextResponse.json({ ok: true });
}
