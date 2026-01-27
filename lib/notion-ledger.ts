import { notionFetch } from '@/lib/notion';

export type LedgerEntryInput = {
  title: string;
  summary?: string;
  status?: string;
  tags?: string[];
  databaseId?: string;
  outputUrl?: string;
  outputId?: string;
};

export type LedgerEntryResult = {
  id: string;
  url?: string;
  status?: string;
  summary: string;
};

const TITLE_FIELD = process.env.NOTION_TITLE_FIELD || 'Name';
const STATUS_FIELD = process.env.NOTION_STATUS_FIELD || 'Status';
const STATUS_TYPE = process.env.NOTION_STATUS_TYPE || 'status';
const SUMMARY_FIELD = process.env.NOTION_SUMMARY_FIELD || 'Summary';
const TAGS_FIELD = process.env.NOTION_TAGS_FIELD || 'Tags';
const OUTPUT_FIELD = process.env.NOTION_LEDGER_OUTPUT_FIELD || 'Output Link';
const OUTPUT_FIELD_TYPE = process.env.NOTION_LEDGER_OUTPUT_FIELD_TYPE || 'url';

export async function createLedgerEntry(
  input: LedgerEntryInput
): Promise<LedgerEntryResult> {
  const databaseId = input.databaseId || process.env.NOTION_LEDGER_DB_ID;

  if (!databaseId) {
    throw new Error(
      'Notion ledger database is missing. Set NOTION_LEDGER_DB_ID.'
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

  if (input.outputUrl && OUTPUT_FIELD_TYPE === 'url') {
    properties[OUTPUT_FIELD] = { url: input.outputUrl };
  }
  if (input.outputId && OUTPUT_FIELD_TYPE === 'relation') {
    properties[OUTPUT_FIELD] = { relation: [{ id: input.outputId }] };
  }

  const data = await notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  return {
    id: data.id || `notion-${Date.now()}`,
    url: data.url,
    status: 'created',
    summary: `Ledger entry created for "${input.title}".`,
  };
}

export async function updateLedgerEntry(
  pageId: string,
  updates: {
    status?: string;
    summary?: string;
    outputUrl?: string;
    outputId?: string;
  }
) {
  const properties: Record<string, unknown> = {};

  if (updates.summary) {
    properties[SUMMARY_FIELD] = {
      rich_text: [{ text: { content: updates.summary } }],
    };
  }

  if (updates.status) {
    properties[STATUS_FIELD] =
      STATUS_TYPE === 'select'
        ? { select: { name: updates.status } }
        : { status: { name: updates.status } };
  }

  if (updates.outputUrl && OUTPUT_FIELD_TYPE === 'url') {
    properties[OUTPUT_FIELD] = { url: updates.outputUrl };
  }

  if (updates.outputId && OUTPUT_FIELD_TYPE === 'relation') {
    properties[OUTPUT_FIELD] = { relation: [{ id: updates.outputId }] };
  }

  if (Object.keys(properties).length === 0) {
    return;
  }

  await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
}
