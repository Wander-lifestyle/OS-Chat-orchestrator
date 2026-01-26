import { Client } from '@notionhq/client';

export interface ClientConfig {
  clientId?: string;
  workspaceId?: string;
  brandVoice?: string;
  beehiivApiKey?: string;
  beehiivPublicationId?: string;
  slackWebhookUrl?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  ledgerDatabaseId?: string;
  briefsDatabaseId?: string;
  performanceDatabaseId?: string;
  learningDatabaseId?: string;
}

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

function hasNotionConfig() {
  return Boolean(process.env.NOTION_API_KEY);
}

function extractPlainText(property: any): string | null {
  if (!property) return null;
  if (property.type === 'title') {
    return property.title?.[0]?.plain_text || null;
  }
  if (property.type === 'rich_text') {
    return property.rich_text?.[0]?.plain_text || null;
  }
  if (property.title) {
    return property.title?.[0]?.plain_text || null;
  }
  if (property.rich_text) {
    return property.rich_text?.[0]?.plain_text || null;
  }
  return null;
}

function extractSelectName(property: any): string | null {
  return property?.select?.name || null;
}

function extractUrl(property: any): string | null {
  return property?.url || null;
}

function extractNumber(property: any): number | null {
  if (!property) return null;
  if (typeof property.number === 'number') return property.number;
  return null;
}

function extractDate(property: any): string | null {
  return property?.date?.start || null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getBeehiivConfig(clientConfig?: ClientConfig) {
  return {
    apiKey: clientConfig?.beehiivApiKey || process.env.BEEHIIV_API_KEY,
    publicationId:
      clientConfig?.beehiivPublicationId || process.env.BEEHIIV_PUBLICATION_ID,
  };
}

function getPerformanceDatabaseId(clientConfig?: ClientConfig) {
  return (
    clientConfig?.performanceDatabaseId || process.env.NOTION_PERFORMANCE_DATABASE_ID
  );
}

function getLearningDatabaseId(clientConfig?: ClientConfig) {
  return clientConfig?.learningDatabaseId || process.env.NOTION_LEARNING_DATABASE_ID;
}

function isApprovedStatus(status?: string | null) {
  return Boolean(status && status.toLowerCase() === 'approved');
}

function toClientConfig(page: any): ClientConfig {
  return {
    clientId: extractPlainText(page.properties?.['Client ID']) || undefined,
    workspaceId: extractPlainText(page.properties?.['Workspace ID']) || undefined,
    brandVoice: extractPlainText(page.properties?.['Brand Voice']) || undefined,
    beehiivApiKey: extractPlainText(page.properties?.['Beehiiv API Key']) || undefined,
    beehiivPublicationId:
      extractPlainText(page.properties?.['Beehiiv Publication ID']) || undefined,
    slackWebhookUrl: extractUrl(page.properties?.['Slack Webhook']) || undefined,
    cloudinaryCloudName:
      extractPlainText(page.properties?.['Cloudinary Cloud Name']) || undefined,
    cloudinaryApiKey:
      extractPlainText(page.properties?.['Cloudinary API Key']) || undefined,
    cloudinaryApiSecret:
      extractPlainText(page.properties?.['Cloudinary API Secret']) || undefined,
    ledgerDatabaseId:
      extractPlainText(page.properties?.['Ledger Database ID']) || undefined,
    briefsDatabaseId:
      extractPlainText(page.properties?.['Briefs Database ID']) || undefined,
    performanceDatabaseId:
      extractPlainText(page.properties?.['Performance Database ID']) || undefined,
    learningDatabaseId:
      extractPlainText(page.properties?.['Learning Database ID']) || undefined,
  };
}

export async function getClientConfig({
  clientId,
  workspaceId,
}: {
  clientId?: string;
  workspaceId?: string;
}): Promise<ClientConfig | null> {
  if (!clientId && !workspaceId) {
    return null;
  }

  if (!hasNotionConfig()) {
    throw new Error('NOTION_API_KEY is not configured');
  }

  if (!process.env.NOTION_CLIENTS_DATABASE_ID) {
    throw new Error('NOTION_CLIENTS_DATABASE_ID is not configured');
  }

  const filters: any[] = [];
  if (clientId) {
    filters.push({
      property: 'Client ID',
      rich_text: { equals: clientId },
    });
  }
  if (workspaceId) {
    filters.push({
      property: 'Workspace ID',
      rich_text: { equals: workspaceId },
    });
  }

  const filter =
    filters.length === 1
      ? filters[0]
      : {
          or: filters,
        };

  const response = await notion.databases.query({
    database_id: process.env.NOTION_CLIENTS_DATABASE_ID,
    filter,
  });

  const page = response.results?.[0];
  if (!page) {
    throw new Error('Client configuration not found');
  }

  return {
    clientId,
    workspaceId,
    ...toClientConfig(page),
  };
}

/**
 * Tool Runtime
 * - All external API calls happen here
 * - Idempotent, structured returns
 * - Catch errors and return { success: false, error: "..." }
 */

// ============================================
// NOTION TOOLS
// ============================================

export async function queryNotionDatabase(
  databaseId: string,
  filter?: Record<string, any>
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  if (!databaseId) {
    return { success: false, error: 'databaseId is required' };
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: filter,
    });
    return {
      success: true,
      rows: response.results.map((page: any) => ({
        id: page.id,
        properties: page.properties,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createNotionPage(
  databaseId: string,
  properties: Record<string, any>
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  if (!databaseId) {
    return { success: false, error: 'databaseId is required' };
  }

  try {
    const page = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: properties,
    });
    return {
      success: true,
      pageId: page.id,
      url: page.url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function updateNotionPage(
  pageId: string,
  properties: Record<string, any>
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  if (!pageId) {
    return { success: false, error: 'pageId is required' };
  }

  try {
    const page = await notion.pages.update({
      page_id: pageId,
      properties: properties,
    });
    return {
      success: true,
      pageId: page.id,
      url: page.url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getLedgerApprovalStatus(pageId: string) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  if (!pageId) {
    return { success: false, error: 'pageId is required' };
  }

  try {
    const page: any = await notion.pages.retrieve({ page_id: pageId });
    const approvalStatus = extractSelectName(page?.properties?.['Approval Status']);
    return { success: true, approvalStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function hasPerformanceRecord(
  beehiivPostId: string,
  clientConfig?: ClientConfig
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured', exists: false };
  }

  const databaseId = getPerformanceDatabaseId(clientConfig);
  if (!databaseId) {
    return { success: false, error: 'NOTION_PERFORMANCE_DATABASE_ID not configured', exists: false };
  }

  if (!beehiivPostId) {
    return { success: false, error: 'beehiivPostId is required', exists: false };
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Beehiiv Post ID',
        rich_text: { equals: beehiivPostId },
      },
      page_size: 1,
    });

    return { success: true, exists: (response.results || []).length > 0 };
  } catch (error: any) {
    return { success: false, error: error.message, exists: false };
  }
}

export async function getRecentPerformanceMetrics(
  track?: string,
  clientConfig?: ClientConfig,
  limit: number = 10
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured', metrics: [] };
  }

  const databaseId = getPerformanceDatabaseId(clientConfig);
  if (!databaseId) {
    return {
      success: false,
      error: 'NOTION_PERFORMANCE_DATABASE_ID not configured',
      metrics: [],
    };
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: track
        ? {
            property: 'Track',
            select: { equals: track },
          }
        : undefined,
      sorts: [
        {
          property: 'Collected At',
          direction: 'descending',
        },
      ],
      page_size: Math.min(limit, 25),
    });

    const metrics = (response.results || []).map((page: any) => ({
      subjectLine: extractPlainText(page.properties?.['Subject Line']) || undefined,
      sends: extractNumber(page.properties?.Sends) ?? undefined,
      opens: extractNumber(page.properties?.Opens) ?? undefined,
      clicks: extractNumber(page.properties?.Clicks) ?? undefined,
      ctr: extractNumber(page.properties?.CTR) ?? undefined,
      unsubscribes: extractNumber(page.properties?.Unsubscribes) ?? undefined,
      sentAt: extractDate(page.properties?.['Sent At']) || undefined,
      collectedAt: extractDate(page.properties?.['Collected At']) || undefined,
    }));

    return { success: true, metrics };
  } catch (error: any) {
    return { success: false, error: error.message, metrics: [] };
  }
}

export async function storePerformanceMetrics(
  input: {
    track?: string;
    channel: string;
    beehiivPostId?: string;
    subjectLine?: string;
    sends?: number;
    opens?: number;
    clicks?: number;
    ctr?: number;
    unsubscribes?: number;
    sentAt?: string;
    ledgerUrl?: string;
    clientId?: string;
    workspaceId?: string;
  },
  clientConfig?: ClientConfig
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  const databaseId = getPerformanceDatabaseId(clientConfig);
  if (!databaseId) {
    return { success: false, error: 'NOTION_PERFORMANCE_DATABASE_ID not configured' };
  }

  const title = input.subjectLine || input.beehiivPostId || 'Performance Entry';

  const properties: Record<string, any> = {
    Name: { title: [{ text: { content: title } }] },
    Channel: { select: { name: input.channel } },
    'Collected At': { date: { start: new Date().toISOString() } },
  };

  if (input.track) {
    properties.Track = { select: { name: input.track } };
  }
  if (input.beehiivPostId) {
    properties['Beehiiv Post ID'] = {
      rich_text: [{ text: { content: input.beehiivPostId } }],
    };
  }
  if (input.subjectLine) {
    properties['Subject Line'] = {
      rich_text: [{ text: { content: input.subjectLine } }],
    };
  }
  if (isFiniteNumber(input.sends)) {
    properties.Sends = { number: input.sends };
  }
  if (isFiniteNumber(input.opens)) {
    properties.Opens = { number: input.opens };
  }
  if (isFiniteNumber(input.clicks)) {
    properties.Clicks = { number: input.clicks };
  }
  if (isFiniteNumber(input.ctr)) {
    properties.CTR = { number: input.ctr };
  }
  if (isFiniteNumber(input.unsubscribes)) {
    properties.Unsubscribes = { number: input.unsubscribes };
  }
  if (input.sentAt) {
    properties['Sent At'] = { date: { start: input.sentAt } };
  }
  if (input.ledgerUrl) {
    properties['Ledger URL'] = { url: input.ledgerUrl };
  }
  if (input.clientId) {
    properties['Client ID'] = { rich_text: [{ text: { content: input.clientId } }] };
  }
  if (input.workspaceId) {
    properties['Workspace ID'] = { rich_text: [{ text: { content: input.workspaceId } }] };
  }

  return createNotionPage(databaseId, properties);
}

export async function storeLearningPattern(
  input: {
    track?: string;
    summary: string;
    evidence?: string;
    applied?: boolean;
  },
  clientConfig?: ClientConfig
) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  const databaseId = getLearningDatabaseId(clientConfig);
  if (!databaseId) {
    return { success: false, error: 'NOTION_LEARNING_DATABASE_ID not configured' };
  }

  const properties: Record<string, any> = {
    Name: { title: [{ text: { content: 'Learning' } }] },
    Summary: { rich_text: [{ text: { content: input.summary } }] },
    'Created Date': { date: { start: new Date().toISOString() } },
    Applied: { checkbox: Boolean(input.applied) },
  };

  if (input.track) {
    properties.Track = { select: { name: input.track } };
  }
  if (input.evidence) {
    properties.Evidence = { rich_text: [{ text: { content: input.evidence } }] };
  }

  return createNotionPage(databaseId, properties);
}

export async function getCampaignLedger(trackId?: string, clientConfig?: ClientConfig) {
  if (!hasNotionConfig()) {
    return { success: false, error: 'NOTION_API_KEY not configured' };
  }

  const databaseId =
    clientConfig?.ledgerDatabaseId || process.env.NOTION_LEDGER_DATABASE_ID;

  if (!databaseId) {
    return { success: false, error: 'NOTION_LEDGER_DATABASE_ID not configured' };
  }

  try {
    const filter = trackId
      ? {
          property: 'Track',
          select: {
            equals: trackId,
          },
        }
      : undefined;

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: filter,
      sorts: [
        {
          property: 'Created Date',
          direction: 'descending',
        },
      ],
    });

    return {
      success: true,
      campaigns: response.results.map((page: any) => ({
        id: page.id,
        name: extractPlainText(page.properties?.Name) || 'Untitled',
        track: extractSelectName(page.properties?.Track) || 'Unknown',
        status: extractSelectName(page.properties?.Status) || 'Draft',
        approvalStatus:
          extractSelectName(page.properties?.['Approval Status']) || 'Pending',
        createdDate: page.properties?.['Created Date']?.date?.start || 'N/A',
        url: page.url,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// CLOUDINARY TOOLS
// ============================================

export async function searchCloudinaryImages(
  query: string,
  limit: number = 3,
  clientConfig?: ClientConfig
) {
  try {
    const cloudName =
      clientConfig?.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME;

    const baseUrl = cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload`
      : 'https://res.cloudinary.com/demo/image/upload';

    return {
      success: true,
      images: [
        {
          id: 'cloudinary-1',
          url: `${baseUrl}/sample-${query}.jpg`,
          alt: `Image for ${query}`,
        },
      ].slice(0, limit),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// BEEHIIV TOOLS
// ============================================

export async function scheduleBeehiivNewsletter(
  subject: string,
  htmlContent: string,
  sendTime: string,
  clientConfig?: ClientConfig,
  ledgerPageId?: string
) {
  try {
    const { apiKey, publicationId } = getBeehiivConfig(clientConfig);

    if (!apiKey || !publicationId) {
      return {
        success: false,
        error: 'Beehiiv is not configured for this client',
      };
    }

    if (!ledgerPageId) {
      return {
        success: false,
        error: 'ledger_page_id is required to enforce approval before scheduling',
      };
    }

    const approvalResult = await getLedgerApprovalStatus(ledgerPageId);
    if (!approvalResult.success) {
      return {
        success: false,
        error: approvalResult.error || 'Unable to verify approval status',
      };
    }

    if (!isApprovedStatus(approvalResult.approvalStatus)) {
      return {
        success: false,
        error: 'Approval required. Set Approval Status to Approved in Notion.',
      };
    }

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: subject,
          content: htmlContent,
          status: 'scheduled',
          scheduled_at: sendTime,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Beehiiv API error ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const postId = data?.data?.id || publicationId;
    const postUrl = data?.data?.url || data?.data?.web_url || '';

    const ledgerUpdate = await updateNotionPage(ledgerPageId, {
      'Beehiiv Post ID': {
        rich_text: [{ text: { content: postId } }],
      },
      'Subject Line': {
        rich_text: [{ text: { content: subject } }],
      },
      'Send Date': {
        date: { start: sendTime },
      },
      Status: {
        select: { name: 'Scheduled' },
      },
    });

    return {
      success: true,
      publicationId: postId,
      url: postUrl,
      scheduledFor: sendTime,
      ledgerUpdated: ledgerUpdate.success,
      ledgerUpdateError: ledgerUpdate.success ? undefined : ledgerUpdate.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function normalizeMetric(value: any): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function extractBeehiivStats(payload: any) {
  const stats =
    payload?.stats ||
    payload?.post_stats ||
    payload?.metrics ||
    payload?.data?.stats ||
    payload?.data?.post_stats ||
    payload?.data?.metrics ||
    {};

  return {
    sends: normalizeMetric(stats?.sent || stats?.sends),
    opens: normalizeMetric(stats?.opens || stats?.unique_opens),
    clicks: normalizeMetric(stats?.clicks || stats?.unique_clicks),
    ctr: normalizeMetric(stats?.ctr || stats?.click_through_rate),
    unsubscribes: normalizeMetric(stats?.unsubscribes || stats?.unsubscribed),
  };
}

export async function listBeehiivPosts(
  limit: number = 10,
  clientConfig?: ClientConfig
) {
  try {
    const { apiKey, publicationId } = getBeehiivConfig(clientConfig);
    if (!apiKey || !publicationId) {
      return { success: false, error: 'Beehiiv is not configured', posts: [] };
    }

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Beehiiv API error ${response.status}: ${errorText}`,
        posts: [],
      };
    }

    const payload = await response.json();
    const posts = (payload?.data || []).map((post: any) => ({
      id: post?.id,
      title: post?.title || post?.subject || post?.name,
      status: post?.status,
      url: post?.url || post?.web_url,
      sentAt:
        post?.published_at ||
        post?.send_at ||
        post?.scheduled_at ||
        post?.created_at,
      stats: extractBeehiivStats(post),
    }));

    return { success: true, posts };
  } catch (error: any) {
    return { success: false, error: error.message, posts: [] };
  }
}

export async function fetchBeehiivPostMetrics(
  postId: string,
  clientConfig?: ClientConfig
) {
  try {
    const { apiKey, publicationId } = getBeehiivConfig(clientConfig);
    if (!apiKey || !publicationId) {
      return { success: false, error: 'Beehiiv is not configured' };
    }

    if (!postId) {
      return { success: false, error: 'postId is required' };
    }

    const response = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/posts/${postId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Beehiiv API error ${response.status}: ${errorText}`,
      };
    }

    const payload = await response.json();
    const stats = extractBeehiivStats(payload);
    const post = payload?.data || {};

    const sends = stats.sends;
    const opens = stats.opens;
    const clicks = stats.clicks;
    const ctr =
      stats.ctr ?? (isFiniteNumber(sends) && sends > 0 ? (clicks || 0) / sends : undefined);

    return {
      success: true,
      metrics: {
        postId,
        subjectLine: post?.title || post?.subject || post?.name,
        sends,
        opens,
        clicks,
        ctr,
        unsubscribes: stats.unsubscribes,
        sentAt:
          post?.published_at ||
          post?.send_at ||
          post?.scheduled_at ||
          post?.created_at,
        url: post?.url || post?.web_url,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// SLACK TOOLS
// ============================================

export async function postSlack(
  message: string,
  channel: string = '#campaigns',
  clientConfig?: ClientConfig
) {
  try {
    const webhookUrl = clientConfig?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return {
        success: false,
        error: 'SLACK_WEBHOOK_URL not configured for this client',
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        channel,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Slack API error ${response.status}: ${errorText}`,
      };
    }

    return {
      success: true,
      message: 'Slack notification sent',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
