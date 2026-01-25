export type LedgerEntryInput = {
  title: string;
  summary?: string;
  status?: string;
  tags?: string[];
};

export type LedgerEntryResult = {
  id: string;
  url?: string;
  summary: string;
};

export async function createLedgerEntry(
  input: LedgerEntryInput
): Promise<LedgerEntryResult> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_LEDGER_DB_ID;

  if (!token || !databaseId) {
    return {
      id: 'notion-unconfigured',
      summary:
        'Notion credentials are missing. Set NOTION_TOKEN and NOTION_LEDGER_DB_ID.',
    };
  }

  // TODO: Implement Notion API call. For now, return a stubbed response.
  return {
    id: `notion-${Date.now()}`,
    url: `https://www.notion.so/${databaseId}`,
    summary: `Ledger entry queued for "${input.title}".`,
  };
}
