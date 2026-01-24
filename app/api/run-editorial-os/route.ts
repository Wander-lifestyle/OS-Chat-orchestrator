import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Bridge endpoint: validate input, run Claude CLI, return output.
const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 60_000;
const MAX_BUFFER_BYTES = 10 * 1024 * 1024;
const ALLOWED_LEVELS = new Set([3, 4, 5]);

type RunEditorialRequest = {
  message?: unknown;
  agentLevel?: unknown;
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

export async function POST(request: NextRequest) {
  let payload: RunEditorialRequest;

  try {
    payload = await request.json();
  } catch (error) {
    console.error('Editorial OS bridge: invalid JSON', error);
    return NextResponse.json(
      { status: 'error', response: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      { status: 'error', response: 'Request body must be a JSON object.' },
      { status: 400 }
    );
  }

  const message = toMessage(payload.message);
  const agentLevel = toAgentLevel(payload.agentLevel);

  if (!message) {
    return NextResponse.json(
      { status: 'error', response: 'message must be a non-empty string.' },
      { status: 400 }
    );
  }

  if (!agentLevel) {
    return NextResponse.json(
      { status: 'error', response: 'agentLevel must be 3, 4, or 5.' },
      { status: 400 }
    );
  }

  const cliPath = process.env.CLAUDE_CLI_PATH || 'claude';
  const agentHandle = `@newsletter-level-${agentLevel}`;

  try {
    // Execute the Claude Code subagent without a shell to avoid injection.
    const { stdout, stderr } = await execFileAsync(
      cliPath,
      ['code', 'run', agentHandle, message],
      { timeout: TIMEOUT_MS, maxBuffer: MAX_BUFFER_BYTES, encoding: 'utf8' }
    );

    const output = [stdout, stderr]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean)
      .join('\n');

    return NextResponse.json({
      status: 'success',
      response: output || 'Command completed with no output.',
    });
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      signal?: string;
      killed?: boolean;
    };

    let response = 'Failed to run Claude Code.';
    if (err.code === 'ENOENT') {
      response =
        'Claude CLI not found. Install it or set CLAUDE_CLI_PATH in .env.local.';
    } else if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
      response =
        'Claude output exceeded the buffer limit. Reduce output size or increase MAX_BUFFER_BYTES.';
    } else if (err.killed || err.signal) {
      response = `Claude command timed out after ${TIMEOUT_MS / 1000} seconds.`;
    } else {
      const details =
        (typeof err.stderr === 'string' && err.stderr.trim()) ||
        (typeof err.stdout === 'string' && err.stdout.trim()) ||
        err.message;
      if (details) {
        response = `Claude command failed: ${details}`;
      }
    }

    console.error('Editorial OS bridge: command failed', {
      agentLevel,
      error: err,
    });

    return NextResponse.json({ status: 'error', response }, { status: 500 });
  }
}
