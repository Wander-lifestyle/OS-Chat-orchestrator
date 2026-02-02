import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-20250514';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface StreamParams {
  system: string;
  messages: Anthropic.MessageParam[];
  model?: string;
  maxTokens?: number;
}

export async function streamClaudeResponse({
  system,
  messages,
  model = MODEL,
  maxTokens = 1600,
}: StreamParams): Promise<ReadableStream<Uint8Array>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key is not configured');
  }

  const stream = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream as AsyncIterable<any>) {
          if (event?.type === 'content_block_start' && event.content_block?.text) {
            controller.enqueue(encoder.encode(event.content_block.text));
          }

          if (event?.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (error) {
        controller.error(error);
        return;
      }

      controller.close();
    },
    cancel() {
      if (typeof (stream as any)?.abort === 'function') {
        (stream as any).abort();
      }
    },
  });
}
