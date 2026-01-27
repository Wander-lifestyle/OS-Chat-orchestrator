import path from 'path';
import { readFile } from 'fs/promises';
import type {
  ContentBlock,
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from '@anthropic-ai/sdk/resources/messages';
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  getAnthropicClient,
} from '@/lib/anthropic';
import { createLedgerEntry } from '@/lib/notion-ledger';
import { scheduleNewsletter } from '@/lib/beehiiv';
import { searchHeroImage } from '@/lib/cloudinary';
import { postNotification } from '@/lib/slack';

export type AgentOS = 'newsletter' | 'social';

export type ToolActivity = {
  name: string;
  ok: boolean;
  summary: string;
  data?: Record<string, unknown>;
};

type RunAgentInput = {
  message: string;
  agentLevel: 3 | 4 | 5;
  os: AgentOS;
};

type RunAgentResult = {
  response: string;
  tools: ToolActivity[];
};

const MAX_TOOL_STEPS = 6;
const AGENTS_DIR = path.join(process.cwd(), 'agents');

const TOOLS: Tool[] = [
  {
    name: 'create_ledger_entry',
    description:
      'Create a campaign ledger entry in Notion. Use after major milestones or when asked to log work.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Entry title.' },
        summary: { type: 'string', description: 'Short summary of work done.' },
        status: { type: 'string', description: 'Status label, e.g. drafted.' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for filtering.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'schedule_beehiiv_newsletter',
    description:
      'Schedule a newsletter in Beehiiv. Use when the user requests scheduling or sending.',
    input_schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Newsletter subject line.' },
        content: {
          type: 'string',
          description: 'Newsletter body content or key sections.',
        },
        sendAt: {
          type: 'string',
          description: 'ISO-8601 datetime for scheduling.',
        },
        audience: {
          type: 'string',
          description: 'Audience segment or list.',
        },
      },
      required: ['subject'],
    },
  },
  {
    name: 'search_cloudinary_image',
    description:
      'Search Cloudinary for a hero image to accompany the newsletter.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords.' },
        tags: { type: 'array', items: { type: 'string' } },
        orientation: {
          type: 'string',
          description: 'Orientation preference such as landscape.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'post_slack_notification',
    description:
      'Post a Slack notification to keep stakeholders informed.',
    input_schema: {
      type: 'object',
      properties: {
        channel: { type: 'string', description: 'Slack channel name or ID.' },
        message: { type: 'string', description: 'Message to post.' },
      },
      required: ['channel', 'message'],
    },
  },
];

const TOOL_HANDLERS: Record<string, (input: unknown) => Promise<unknown>> = {
  create_ledger_entry: async (input) => createLedgerEntry(input as any),
  schedule_beehiiv_newsletter: async (input) => scheduleNewsletter(input as any),
  search_cloudinary_image: async (input) => searchHeroImage(input as any),
  post_slack_notification: async (input) => postNotification(input as any),
};

const loadAgentPrompt = async (os: AgentOS, level: 3 | 4 | 5) => {
  const agentPath = path.join(AGENTS_DIR, `${os}-level-${level}.md`);
  return readFile(agentPath, 'utf8');
};

const extractToolUses = (content: ContentBlock[]) =>
  content.filter((block) => block.type === 'tool_use') as ToolUseBlock[];

const extractText = (content: ContentBlock[]) =>
  content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

const toToolResult = (
  toolUse: ToolUseBlock,
  payload: unknown,
  isError = false
): ToolResultBlockParam => ({
  type: 'tool_result',
  tool_use_id: toolUse.id,
  content:
    typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
  is_error: isError || undefined,
});

const summarizeToolPayload = (payload: unknown, fallback: string) => {
  if (typeof payload === 'string') {
    return payload;
  }
  if (payload && typeof payload === 'object' && 'summary' in payload) {
    const summary = (payload as { summary?: unknown }).summary;
    if (typeof summary === 'string' && summary.trim().length > 0) {
      return summary;
    }
  }
  return fallback;
};

const pickToolMeta = (payload: unknown): Record<string, unknown> | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const data = payload as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  ['id', 'status', 'url', 'channel'].forEach((key) => {
    if (data[key] !== undefined) {
      picked[key] = data[key];
    }
  });

  return Object.keys(picked).length > 0 ? picked : undefined;
};

export const runEditorialAgent = async ({
  message,
  agentLevel,
  os,
}: RunAgentInput): Promise<RunAgentResult> => {
  const client = getAnthropicClient();
  const systemPrompt = await loadAgentPrompt(os, agentLevel);
  const messages: MessageParam[] = [{ role: 'user', content: message }];
  const toolActivity: ToolActivity[] = [];

  let lastText = '';

  for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
      system: systemPrompt,
      messages,
      tools: TOOLS,
    });

    const content = response.content ?? [];
    const toolUses = extractToolUses(content);
    const text = extractText(content);

    if (text) {
      lastText = text;
    }

    if (toolUses.length === 0) {
      return {
        response: lastText || 'No response text returned.',
        tools: toolActivity,
      };
    }

    const toolOutcomes = await Promise.all(
      toolUses.map(async (toolUse) => {
        const handler = TOOL_HANDLERS[toolUse.name];
        if (!handler) {
          return {
            toolResult: toToolResult(
              toolUse,
              { error: `Unknown tool: ${toolUse.name}` },
              true
            ),
            activity: {
              name: toolUse.name,
              ok: false,
              summary: `Unknown tool: ${toolUse.name}`,
            },
          };
        }

        try {
          const result = await handler(toolUse.input);
          return {
            toolResult: toToolResult(toolUse, result),
            activity: {
              name: toolUse.name,
              ok: true,
              summary: summarizeToolPayload(
                result,
                `Tool ${toolUse.name} completed.`
              ),
              data: pickToolMeta(result),
            },
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Tool execution failed.';
          return {
            toolResult: toToolResult(toolUse, { error: message }, true),
            activity: {
              name: toolUse.name,
              ok: false,
              summary: message,
            },
          };
        }
      })
    );

    toolOutcomes.forEach((outcome) => {
      toolActivity.push(outcome.activity);
    });

    const toolResults: ToolResultBlockParam[] = toolOutcomes.map(
      (outcome) => outcome.toolResult
    );

    messages.push({
      role: 'assistant',
      content: content as MessageParam['content'],
    });
    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error('Tool loop exceeded maximum steps.');
};
