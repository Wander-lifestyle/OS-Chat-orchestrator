import type Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { streamClaudeResponse } from '@/lib/claude';
import { extractTextFromFiles, formatExtractedFiles, UploadedFile } from '@/lib/files';
import { loadNewsletterSkills } from '@/lib/skills';
import { buildSystemPrompt, loadClientConfig } from '@/lib/prompts';

export const runtime = 'nodejs';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message: string;
  files?: UploadedFile[];
  conversationHistory?: ConversationMessage[];
}

const isConversationMessage = (value: unknown): value is ConversationMessage => {
  if (!value || typeof value !== 'object') return false;
  const message = value as ConversationMessage;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  );
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const files = Array.isArray(body?.files) ? body.files : [];
    const conversationHistory = Array.isArray(body?.conversationHistory)
      ? body.conversationHistory
      : [];

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required.' },
        { status: 400 }
      );
    }

    const config = loadClientConfig();
    const skills = loadNewsletterSkills();
    const systemPrompt = buildSystemPrompt(config, skills);

    const extractedFiles = await extractTextFromFiles(files);
    const fileContext = formatExtractedFiles(extractedFiles);
    const userMessage = [message, fileContext].filter(Boolean).join('\n\n');

    const history: Anthropic.MessageParam[] = conversationHistory
      .filter(isConversationMessage)
      .map((entry) => ({
        role: entry.role,
        content: entry.content,
      }));

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: userMessage },
    ];

    const stream = await streamClaudeResponse({ system: systemPrompt, messages });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
