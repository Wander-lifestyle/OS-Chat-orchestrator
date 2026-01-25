export type LedgerEntryInput = {
  title: string;
  summary?: string;
  status?: string;
  tags?: string[];
};

import { fetchWithTimeout } from '@/lib/http';

export type LedgerEntryResult = {
  id: string;
  url?: string;
  status?: string;
  summary: string;
};

const NOTION_API_URL = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = process.env.NOTION_VERSION || '2022-06-28';
const TITLE_FIELD = process.env.NOTION_TITLE_FIELD || 'Name';
const STATUS_FIELD = process.env.NOTION_STATUS_FIELD || 'Status';
const STATUS_TYPE = process.env.NOTION_STATUS_TYPE || 'status';
const SUMMARY_FIELD = process.env.NOTION_SUMMARY_FIELD || 'Summary';
const TAGS_FIELD = process.env.NOTION_TAGS_FIELD || 'Tags';

export async function createLedgerEntry(
  input: LedgerEntryInput
): Promise<LedgerEntryResult> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_LEDGER_DB_ID;

  if (!token || !databaseId) {
    throw new Error(
      'Notion credentials are missing. Set NOTION_TOKEN and NOTION_LEDGER_DB_ID.'
    );
  }

  const properties: Record<string, unknown> = {
    [TITLE_FIELD]: {
      title: [{ text: { content: input.title } }],
    },
  };

  if (input.summary) {
    properties[SUMMARY_FIELD] = {
      rich_text: [{ text: { content: input.summary } }],
    };
  }

  if (input.status) {
    properties[STATUS_FIELD] =
      STATUS_TYPE === 'select'
        ? { select: { name: input.status } }
        : { status: { name: input.status } };
  }

  if (input.tags && input.tags.length > 0) {
    properties[TAGS_FIELD] = {
      multi_select: input.tags.map((tag) => ({ name: tag })),
    };
  }

  const response = await fetchWithTimeout(NOTION_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Notion API error (${response.status}): ${errorText || 'Unknown error.'}`
    );
  }

  const data = await response.json();

  return {
    id: data.id || `notion-${Date.now()}`,
    url: data.url,
    status: 'created',
    summary: `Ledger entry created for "${input.title}".`,
  };
}
