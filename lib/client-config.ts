export type ClientNotionConfig = {
  baseOsPageId?: string;
  skillsDbId?: string;
  outputsDbId?: string;
  historyDbId?: string;
  ledgerDbId?: string;
};

export type ClientConfig = {
  id: string;
  name?: string;
  notion: ClientNotionConfig;
};

const DEFAULT_CLIENT_ID = process.env.NOTION_DEFAULT_CLIENT_ID || 'default';

const buildDefaultConfig = (): ClientConfig => ({
  id: DEFAULT_CLIENT_ID,
  name: process.env.NOTION_DEFAULT_CLIENT_NAME || 'Default Client',
  notion: {
    baseOsPageId: process.env.NOTION_BASE_OS_PAGE_ID,
    skillsDbId: process.env.NOTION_SKILLS_DB_ID,
    outputsDbId: process.env.NOTION_OUTPUTS_DB_ID,
    historyDbId: process.env.NOTION_HISTORY_DB_ID,
    ledgerDbId: process.env.NOTION_LEDGER_DB_ID,
  },
});

const parseJsonEnv = (key: string) => {
  const raw = process.env[key];
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to parse ${key}`, error);
    return null;
  }
};

export const getClientConfig = (clientId?: string): ClientConfig => {
  const configMap = parseJsonEnv('NOTION_CLIENT_CONFIG_JSON') || {};
  const resolvedId = clientId || DEFAULT_CLIENT_ID;
  const entry = configMap[resolvedId];

  if (entry) {
    return {
      id: resolvedId,
      name: entry.name || resolvedId,
      notion: {
        baseOsPageId: entry.base_os_page_id,
        skillsDbId: entry.skills_db_id,
        outputsDbId: entry.outputs_db_id,
        historyDbId: entry.history_db_id,
        ledgerDbId: entry.ledger_db_id,
      },
    };
  }

  return buildDefaultConfig();
};

export const getClientIdForSlackChannel = (channelId?: string) => {
  const mapping = parseJsonEnv('SLACK_CHANNEL_CLIENT_MAP') || {};
  if (channelId && mapping[channelId]) {
    return mapping[channelId] as string;
  }
  return process.env.SLACK_DEFAULT_CLIENT_ID || DEFAULT_CLIENT_ID;
};
