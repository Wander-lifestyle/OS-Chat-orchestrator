// In-memory ledger for the single-app demo.
// Replace with a real database (Postgres) for production.
export type LedgerStatus = 'intake' | 'drafted' | 'scheduled' | 'sent' | 'closed';

export interface LedgerEntry {
  id: string;
  projectName: string;
  objective: string;
  audience?: string;
  channels: string[];
  briefId: string;
  status: LedgerStatus;
  createdAt: string;
  updatedAt: string;
  drafts?: {
    newsletter?: {
      subject: string;
      previewText: string;
      body: string;
    };
    social?: {
      posts: string[];
    };
  };
  assets?: Array<{
    url: string;
    publicId?: string;
    alt?: string;
  }>;
  scheduling?: Array<{
    channel: 'email' | 'social';
    status: 'scheduled' | 'draft' | 'skipped' | 'failed';
    link?: string;
    message?: string;
  }>;
}

const ledgerStore = new Map<string, LedgerEntry>();

function generateId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `${prefix}-${date}-${random}`;
}

export function createLedgerEntry(input: {
  projectName: string;
  objective: string;
  audience?: string;
  channels: string[];
  briefId: string;
}): LedgerEntry {
  const now = new Date().toISOString();
  const entry: LedgerEntry = {
    id: generateId('LED'),
    projectName: input.projectName,
    objective: input.objective,
    audience: input.audience,
    channels: input.channels,
    briefId: input.briefId,
    status: 'intake',
    createdAt: now,
    updatedAt: now,
  };

  ledgerStore.set(entry.id, entry);
  return entry;
}

export function updateLedgerEntry(
  id: string,
  updates: Partial<Omit<LedgerEntry, 'id' | 'createdAt'>>
) {
  const existing = ledgerStore.get(id);
  if (!existing) return null;

  const updated: LedgerEntry = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  ledgerStore.set(id, updated);
  return updated;
}

export function getLedgerEntry(id: string) {
  return ledgerStore.get(id) || null;
}

export function listLedgerEntries() {
  return Array.from(ledgerStore.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}
