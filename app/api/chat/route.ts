import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { tools } from '@/lib/tools/definitions';
import { executeTool } from '@/lib/tools/executor';
import { loadAllPrompts } from '@/lib/prompts/loader';
import { isSupabaseConfigured, supabase } from '@/lib/db/client';
import { ChatMessage } from '@/types';

export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-3-5-sonnet-latest';
const MAX_TOOL_LOOPS = 8;

export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as {
      messages: ChatMessage[];
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = await loadAllPrompts();

    const conversation: Anthropic.MessageParam[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: systemPrompt,
      tools,
      messages: conversation,
    });

    const toolNames: string[] = [];
    const createdBriefs: string[] = [];
    const createdNewsletters: string[] = [];
    const ledgerIds: string[] = [];

    let loops = 0;
    while (response.stop_reason === 'tool_use' && loops < MAX_TOOL_LOOPS) {
      loops += 1;
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        try {
          const result = await executeTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          toolNames.push(toolUse.name);

          if (toolUse.name === 'create_brief' && result && typeof result === 'object') {
            const briefResult = result as { uuid?: string; ledger_id?: string };
            if (briefResult.uuid) createdBriefs.push(briefResult.uuid);
            if (briefResult.ledger_id) ledgerIds.push(briefResult.ledger_id);
          }

          if (toolUse.name === 'create_newsletter' && result && typeof result === 'object') {
            const newsletterResult = result as { draft_id?: string; ledger_id?: string };
            if (newsletterResult.draft_id) createdNewsletters.push(newsletterResult.draft_id);
            if (newsletterResult.ledger_id) ledgerIds.push(newsletterResult.ledger_id);
          }

          if (toolUse.name === 'update_campaign' && result && typeof result === 'object') {
            const campaignResult = result as { ledger_id?: string };
            if (campaignResult.ledger_id) ledgerIds.push(campaignResult.ledger_id);
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({
              error: error instanceof Error ? error.message : 'Tool execution failed',
            }),
            is_error: true,
          });
        }
      }

      conversation.push({ role: 'assistant', content: response.content });
      conversation.push({ role: 'user', content: toolResults });

      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1600,
        system: systemPrompt,
        tools,
        messages: conversation,
      });
    }

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const finalMessage = textBlocks.map((block) => block.text).join('\n');

    if (isSupabaseConfigured()) {
      const lastUser = messages.filter((msg) => msg.role === 'user').pop();
      if (lastUser) {
        await supabase.from('chat_history').insert({
          user_message: lastUser.content,
          assistant_response: finalMessage,
          tools_used: toolNames,
          created_briefs: createdBriefs.length > 0 ? createdBriefs : null,
          created_newsletters: createdNewsletters.length > 0 ? createdNewsletters : null,
          ledger_ids: ledgerIds.length > 0 ? ledgerIds : null,
        });
      }
    }

    return NextResponse.json({ message: finalMessage });
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
