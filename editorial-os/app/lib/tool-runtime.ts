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
  clientConfig?: ClientConfig
) {
  try {
    const apiKey = clientConfig?.beehiivApiKey || process.env.BEEHIIV_API_KEY;
    const publicationId =
      clientConfig?.beehiivPublicationId || process.env.BEEHIIV_PUBLICATION_ID;

    if (!apiKey || !publicationId) {
      return {
        success: false,
        error: 'Beehiiv is not configured for this client',
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

    return {
      success: true,
      publicationId: data?.data?.id || publicationId,
      url: data?.data?.url || data?.data?.web_url || '',
      scheduledFor: sendTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
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
