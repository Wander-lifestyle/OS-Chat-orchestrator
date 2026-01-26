import Anthropic from '@anthropic-ai/sdk';
import * as toolRuntime from './tool-runtime';
import { ClientConfig } from './tool-runtime';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ToolInput {
  [key: string]: any;
}

const MAX_TOOL_LOOPS = 8;

/**
 * Define tools that Claude can call
 * Each tool maps to a function in tool-runtime.ts
 */
export const tools: Anthropic.Tool[] = [
  {
    name: 'query_notion',
    description: 'Query a Notion database. Returns matching pages with properties.',
    input_schema: {
      type: 'object' as const,
      properties: {
        database_id: {
          type: 'string',
          description: 'Notion database ID (e.g., NOTION_LEDGER_DATABASE_ID)',
        },
        filter: {
          type: 'object',
          description: 'Optional Notion filter object. See Notion API docs for structure.',
        },
      },
      required: ['database_id'],
    },
  },
  {
    name: 'create_notion_page',
    description: 'Create a new page in a Notion database.',
    input_schema: {
      type: 'object' as const,
      properties: {
        database_id: {
          type: 'string',
          description: 'Notion database ID',
        },
        properties: {
          type: 'object',
          description:
            'Page properties. Keys are property names, values are Notion property objects.',
        },
      },
      required: ['database_id', 'properties'],
    },
  },
  {
    name: 'update_notion_page',
    description: 'Update properties of an existing Notion page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_id: {
          type: 'string',
          description: 'Notion page ID',
        },
        properties: {
          type: 'object',
          description: 'Properties to update',
        },
      },
      required: ['page_id', 'properties'],
    },
  },
  {
    name: 'search_cloudinary',
    description: 'Search for images in Cloudinary by tag or query.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: "Search query (e.g., 'hero', 'product', 'lifestyle')",
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default: 3)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'schedule_beehiiv_newsletter',
    description: 'Schedule a newsletter to be published in Beehiiv at a specific time.',
    input_schema: {
      type: 'object' as const,
      properties: {
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        html_content: {
          type: 'string',
          description: 'HTML content of the email',
        },
        send_time: {
          type: 'string',
          description: 'ISO 8601 datetime when to send (e.g., 2026-01-24T08:00:00Z)',
        },
        ledger_page_id: {
          type: 'string',
          description:
            'Notion page ID for the Campaign Ledger entry (required for approval gating).',
        },
      },
      required: ['subject', 'html_content', 'send_time', 'ledger_page_id'],
    },
  },
  {
    name: 'post_slack',
    description: 'Post a notification to Slack.',
    input_schema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'Message text',
        },
        channel: {
          type: 'string',
          description: 'Channel name (e.g., #campaigns)',
        },
      },
      required: ['message'],
    },
  },
];

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  toolInput: ToolInput,
  clientConfig?: ClientConfig
): Promise<string> {
  try {
    let result;

    switch (toolName) {
      case 'query_notion':
        result = await toolRuntime.queryNotionDatabase(
          toolInput.database_id,
          toolInput.filter
        );
        break;
      case 'create_notion_page':
        result = await toolRuntime.createNotionPage(
          toolInput.database_id,
          toolInput.properties
        );
        break;
      case 'update_notion_page':
        result = await toolRuntime.updateNotionPage(toolInput.page_id, toolInput.properties);
        break;
      case 'search_cloudinary':
        result = await toolRuntime.searchCloudinaryImages(
          toolInput.query,
          toolInput.limit,
          clientConfig
        );
        break;
      case 'schedule_beehiiv_newsletter':
        result = await toolRuntime.scheduleBeehiivNewsletter(
          toolInput.subject,
          toolInput.html_content,
          toolInput.send_time,
          clientConfig,
          toolInput.ledger_page_id
        );
        break;
      case 'post_slack':
        result = await toolRuntime.postSlack(toolInput.message, toolInput.channel, clientConfig);
        break;
      default:
        return JSON.stringify({ success: false, error: 'Unknown tool' });
    }

    return JSON.stringify(result);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Main agent loop
 * Continues until Claude stops requesting tools
 */
export async function runAgentLoop(
  systemPrompt: string,
  userMessage: string,
  clientConfig?: ClientConfig
): Promise<{ finalResponse: string; toolCalls: any[] }> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const toolCalls: any[] = [];

  let loops = 0;
  while (loops < MAX_TOOL_LOOPS) {
    loops += 1;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      tools: tools,
      messages: messages,
    });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (toolUseBlocks.length === 0) {
      return {
        finalResponse: textBlocks.map((b) => b.text).join('\n'),
        toolCalls: toolCalls,
      };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(toolUse.name, toolUse.input as ToolInput, clientConfig);

      toolCalls.push({
        tool: toolUse.name,
        input: toolUse.input,
        result: result,
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    messages.push({
      role: 'assistant',
      content: response.content,
    });

    messages.push({
      role: 'user',
      content: toolResults,
    });
  }

  return {
    finalResponse: 'Tool loop limit reached. Please refine your request.',
    toolCalls: toolCalls,
  };
}

export default client;
