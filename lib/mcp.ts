import 'server-only';

import type Anthropic from '@anthropic-ai/sdk';

interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface McpServerConfig {
  id: string;
  label: string;
  url?: string;
  apiKey?: string;
}

interface ToolMapping {
  serverId: string;
  toolName: string;
}

export interface McpToolRegistry {
  tools: Anthropic.Tool[];
  toolMap: Record<string, ToolMapping>;
}

const MCP_SERVERS: McpServerConfig[] = [
  {
    id: 'vp',
    label: 'VP Marketing',
    url: process.env.MCP_VP_URL,
    apiKey: process.env.MCP_VP_API_KEY || process.env.MCP_API_KEY,
  },
  {
    id: 'demand_gen',
    label: 'Director Demand Gen',
    url: process.env.MCP_DEMAND_GEN_URL,
    apiKey: process.env.MCP_DEMAND_GEN_API_KEY || process.env.MCP_API_KEY,
  },
  {
    id: 'brand_comms',
    label: 'Director Brand Comms',
    url: process.env.MCP_BRAND_COMMS_URL,
    apiKey: process.env.MCP_BRAND_COMMS_API_KEY || process.env.MCP_API_KEY,
  },
  {
    id: 'product_marketing',
    label: 'Director Product Marketing',
    url: process.env.MCP_PRODUCT_MARKETING_URL,
    apiKey: process.env.MCP_PRODUCT_MARKETING_API_KEY || process.env.MCP_API_KEY,
  },
];

const SERVER_BY_ID = new Map(MCP_SERVERS.map((server) => [server.id, server]));
const TOOL_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedRegistry: { expiresAt: number; registry: McpToolRegistry } | null = null;

const normalizeToolName = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

const buildToolName = (serverId: string, toolName: string) =>
  `${serverId}__${normalizeToolName(toolName)}`;

const buildHeaders = (apiKey?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['x-api-key'] = apiKey;
  }

  return headers;
};

const parseToolList = (result: unknown): McpToolDefinition[] => {
  if (!result || typeof result !== 'object') return [];
  const payload = result as { tools?: unknown };
  if (Array.isArray(payload.tools)) {
    return payload.tools as McpToolDefinition[];
  }
  return [];
};

const formatToolResult = (result: unknown) => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result !== 'object') return String(result);

  const payload = result as { content?: Array<{ type?: string; text?: string }> };
  if (Array.isArray(payload.content)) {
    const text = payload.content
      .map((block) => (block?.text ? block.text : ''))
      .filter(Boolean)
      .join('\n');
    if (text) return text;
  }

  return JSON.stringify(result, null, 2);
};

const callMcp = async (server: McpServerConfig, method: string, params?: object) => {
  if (!server.url) {
    throw new Error(`MCP server URL not configured for ${server.label}`);
  }

  const response = await fetch(server.url, {
    method: 'POST',
    headers: buildHeaders(server.apiKey),
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `${server.id}-${Date.now()}`,
      method,
      params: params ?? {},
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `MCP ${server.label} error (${response.status}): ${text || 'Request failed'}`
    );
  }

  const data = (await response.json()) as {
    error?: { message?: string };
    result?: unknown;
  };

  if (data.error) {
    throw new Error(data.error.message || `MCP ${server.label} returned an error`);
  }

  return data.result;
};

const fetchMcpTools = async (server: McpServerConfig) => {
  const result = await callMcp(server, 'tools/list');
  return parseToolList(result);
};

export const getMcpToolRegistry = async (): Promise<McpToolRegistry> => {
  const now = Date.now();
  if (cachedRegistry && cachedRegistry.expiresAt > now) {
    return cachedRegistry.registry;
  }

  const tools: McpToolRegistry['tools'] = [];
  const toolMap: Record<string, ToolMapping> = {};

  for (const server of MCP_SERVERS) {
    if (!server.url) continue;
    try {
      const serverTools = await fetchMcpTools(server);
      for (const tool of serverTools) {
        const toolName = buildToolName(server.id, tool.name);
        toolMap[toolName] = { serverId: server.id, toolName: tool.name };
        tools.push({
          name: toolName,
          description: tool.description || `${server.label} tool`,
          input_schema:
            (tool.inputSchema as Record<string, unknown>) || {
              type: 'object',
              properties: {},
            },
        });
      }
    } catch (error) {
      console.warn(`Failed to load tools from ${server.label}:`, error);
    }
  }

  const registry = { tools, toolMap };
  cachedRegistry = {
    registry,
    expiresAt: now + TOOL_CACHE_TTL_MS,
  };

  return registry;
};

export const callMcpTool = async (toolName: string, input: Record<string, unknown>) => {
  const registry = await getMcpToolRegistry();
  const mapping = registry.toolMap[toolName];
  if (!mapping) {
    throw new Error(`Unknown MCP tool: ${toolName}`);
  }

  const server = SERVER_BY_ID.get(mapping.serverId);
  if (!server) {
    throw new Error(`MCP server not found for tool: ${toolName}`);
  }

  const result = await callMcp(server, 'tools/call', {
    name: mapping.toolName,
    arguments: input ?? {},
  });

  return formatToolResult(result);
};
