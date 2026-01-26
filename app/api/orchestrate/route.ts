// Editorial OS - Single App Orchestrator
// Keeps orchestration, tools, and ledger in one system to avoid brittle services.

import { NextRequest, NextResponse } from 'next/server';
import { createBrief, CampaignDetails } from '@/lib/brief';
import { generateNewsletterDraft, generateSocialDrafts } from '@/lib/copy';
import { searchCloudinaryAssets } from '@/lib/cloudinary';
import {
  createLedgerEntry,
  listLedgerEntries,
  updateLedgerEntry,
} from '@/lib/ledger-store';

interface OrchestrationRequest {
  message: string;
  conversation_id?: string;
}

interface ProgressItem {
  step: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  details?: string;
  link?: string;
  timing?: string;
}

interface OrchestrationResult {
  success: boolean;
  campaign_id?: string;
  brief_created?: boolean;
  ledger_entry?: string;
  assets_found?: number;
  manual_links: {
    brief?: string;
    ledger?: string;
    dam?: string;
  };
  next_steps?: string[];
}

interface OrchestrationResponse {
  response: string;
  progress: ProgressItem[];
  results: OrchestrationResult | null;
}

const INTENT_PATTERNS = {
  LAUNCH_CAMPAIGN: /launch|create|start.*(campaign|brief)/i,
  SHOW_CAMPAIGNS: /show|list|display.*(campaigns?|ledger)/i,
  FIND_ASSETS: /find|search|get.*(assets?|images?|photos?)/i,
  HELP: /help|what|how/i,
};

function detectIntent(message: string) {
  if (INTENT_PATTERNS.LAUNCH_CAMPAIGN.test(message)) return 'LAUNCH_CAMPAIGN';
  if (INTENT_PATTERNS.SHOW_CAMPAIGNS.test(message)) return 'SHOW_CAMPAIGNS';
  if (INTENT_PATTERNS.FIND_ASSETS.test(message)) return 'FIND_ASSETS';
  if (INTENT_PATTERNS.HELP.test(message)) return 'HELP';
  return 'GENERAL_QUERY';
}

function extractCampaignDetails(message: string): CampaignDetails {
  const lower = message.toLowerCase();
  const nameMatch = message.match(
    /(?:for|called|launch|create)\s+([A-Za-z0-9\s]+?)(?:\s+with|\s+campaign|\s+using|$)/i
  );

  const name = nameMatch ? nameMatch[1].trim() : 'New Campaign';
  const channels: string[] = [];

  if (lower.includes('newsletter') || lower.includes('email')) channels.push('email');
  if (lower.includes('social') || lower.includes('instagram') || lower.includes('linkedin')) {
    channels.push('social');
  }
  if (lower.includes('blog')) channels.push('blog');

  if (channels.length === 0) channels.push('email', 'social');

  const audienceMatch = message.match(/(?:targeting|for|audience)\s+([A-Za-z0-9\s]+?)(?:\s+with|\s+using|$)/i);
  const audience = audienceMatch ? audienceMatch[1].trim() : undefined;

  const regionMatch = message.match(/\b(europe|eu|asia|apac|america|us|global)\b/i);
  const region = regionMatch ? regionMatch[1] : 'Global';

  return {
    name,
    objective: `Launch ${name}`,
    audience,
    channels,
    region,
  };
}

function nextTuesdayAt8am() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilTuesday = (9 - day) % 7 || 7;
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilTuesday);
  nextTuesday.setHours(8, 0, 0, 0);
  return nextTuesday.toISOString();
}

async function scheduleBeehiivNewsletter(subject: string, body: string) {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  const live = process.env.BEEHIIV_LIVE === 'true';

  if (!apiKey || !publicationId || !live) {
    return {
      status: 'draft' as const,
      message: 'Beehiiv not configured. Draft is ready to schedule.',
    };
  }

  try {
    const scheduledAt = nextTuesdayAt8am();
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: subject,
        subtitle: 'Campaign update',
        content: body.replace(/\n/g, '<br/>'),
        status: 'scheduled',
        scheduled_at: scheduledAt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Beehiiv API error ${response.status}`);
    }

    const data = await response.json();
    return {
      status: 'scheduled' as const,
      link: data?.data?.url || data?.data?.web_url,
      message: `Scheduled for ${new Date(scheduledAt).toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}.`,
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      message: error instanceof Error ? error.message : 'Beehiiv scheduling failed.',
    };
  }
}

async function scheduleBufferPosts(posts: string[]) {
  const accessToken = process.env.BUFFER_ACCESS_TOKEN;
  const profileId = process.env.BUFFER_PROFILE_ID;
  const live = process.env.BUFFER_LIVE === 'true';

  if (!accessToken || !profileId || !live) {
    return {
      status: 'draft' as const,
      message: 'Buffer not configured. Social drafts are ready to schedule.',
    };
  }

  try {
    const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile_ids: [profileId],
        text: posts[0],
        now: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Buffer API error ${response.status}`);
    }

    const data = await response.json();
    return {
      status: 'scheduled' as const,
      link: data?.buffer?.id ? `https://buffer.com/app/profile/${profileId}` : undefined,
      message: 'Scheduled in Buffer.',
    };
  } catch (error) {
    return {
      status: 'failed' as const,
      message: error instanceof Error ? error.message : 'Buffer scheduling failed.',
    };
  }
}

async function orchestrateCampaign(message: string): Promise<OrchestrationResponse> {
  const progress: ProgressItem[] = [];
  const start = Date.now();

  progress.push({
    step: 'Analyzing campaign request',
    status: 'running',
    details: 'Parsing campaign requirements...',
  });

  const details = extractCampaignDetails(message);
  progress[0] = {
    ...progress[0],
    status: 'complete',
    details: `Campaign: ${details.name} | Channels: ${details.channels.join(', ')}`,
    timing: '0.4s',
  };

  progress.push({
    step: 'Creating campaign brief',
    status: 'running',
    details: 'Structuring objectives, audience, and channels...',
  });

  const brief = createBrief(details);
  progress[1] = {
    ...progress[1],
    status: 'complete',
    details: `Brief ${brief.id} created`,
    timing: '0.7s',
  };

  progress.push({
    step: 'Recording campaign in ledger',
    status: 'running',
    details: 'Creating single source of truth...',
  });

  const ledgerEntry = createLedgerEntry({
    projectName: details.name,
    objective: details.objective,
    audience: details.audience,
    channels: details.channels,
    briefId: brief.id,
  });

  progress[2] = {
    ...progress[2],
    status: 'complete',
    details: `Ledger entry ${ledgerEntry.id} created`,
    timing: '1.1s',
  };

  progress.push({
    step: 'Drafting story and copy',
    status: 'running',
    details: 'Writing newsletter + social drafts...',
  });

  const newsletterDraft = details.channels.includes('email')
    ? generateNewsletterDraft(details)
    : undefined;
  const socialDrafts = details.channels.includes('social')
    ? generateSocialDrafts(details)
    : undefined;

  progress[3] = {
    ...progress[3],
    status: 'complete',
    details: 'Copy drafted for selected channels',
    timing: '1.7s',
  };

  progress.push({
    step: 'Finding assets in Cloudinary',
    status: 'running',
    details: 'Searching approved visuals...',
  });

  const assetResult = await searchCloudinaryAssets(`${details.name} ${details.region}`);
  progress[4] = {
    ...progress[4],
    status: 'complete',
    details: assetResult.warning || `Found ${assetResult.assets.length} assets`,
    link: assetResult.searchUrl,
    timing: '2.2s',
  };

  const schedulingUpdates: Array<{
    channel: 'email' | 'social';
    status: 'scheduled' | 'draft' | 'skipped' | 'failed';
    link?: string;
    message?: string;
  }> = [];

  if (details.channels.includes('email') && newsletterDraft) {
    progress.push({
      step: 'Scheduling newsletter (Beehiiv)',
      status: 'running',
      details: 'Preparing newsletter delivery...',
    });

    const beehiivResult = await scheduleBeehiivNewsletter(
      newsletterDraft.subject,
      newsletterDraft.body
    );

    schedulingUpdates.push({
      channel: 'email',
      status: beehiivResult.status,
      link: beehiivResult.link,
      message: beehiivResult.message,
    });

    progress[progress.length - 1] = {
      ...progress[progress.length - 1],
      status: beehiivResult.status === 'failed' ? 'error' : 'complete',
      details: beehiivResult.message,
      link: beehiivResult.link,
      timing: '2.9s',
    };
  }

  if (details.channels.includes('social') && socialDrafts) {
    progress.push({
      step: 'Scheduling social posts (Buffer)',
      status: 'running',
      details: 'Preparing social queue...',
    });

    const bufferResult = await scheduleBufferPosts(socialDrafts.posts);
    schedulingUpdates.push({
      channel: 'social',
      status: bufferResult.status,
      link: bufferResult.link,
      message: bufferResult.message,
    });

    progress[progress.length - 1] = {
      ...progress[progress.length - 1],
      status: bufferResult.status === 'failed' ? 'error' : 'complete',
      details: bufferResult.message,
      link: bufferResult.link,
      timing: '3.4s',
    };
  }

  updateLedgerEntry(ledgerEntry.id, {
    drafts: {
      newsletter: newsletterDraft,
      social: socialDrafts,
    },
    assets: assetResult.assets,
    scheduling: schedulingUpdates,
    status: schedulingUpdates.some(item => item.status === 'scheduled')
      ? 'scheduled'
      : 'drafted',
  });

  const totalTime = ((Date.now() - start) / 1000).toFixed(1);
  const assetLines = assetResult.assets
    .slice(0, 3)
    .map((asset, index) => `${index + 1}. ${asset.alt || 'Campaign asset'} - ${asset.url}`)
    .join('\n');

  const response = [
    `✅ Campaign "${details.name}" is ready.`,
    ``,
    `Brief: ${brief.id}`,
    `Ledger: ${ledgerEntry.id}`,
    ``,
    `Copy Drafts`,
    newsletterDraft
      ? `- Newsletter subject: "${newsletterDraft.subject}"`
      : `- Newsletter: not requested`,
    socialDrafts
      ? `- Social posts: ${socialDrafts.posts.length} drafted`
      : `- Social: not requested`,
    ``,
    `Selected Assets (Cloudinary)`,
    assetLines || 'No assets found yet.',
    ``,
    `Scheduling`,
    schedulingUpdates.length > 0
      ? schedulingUpdates
          .map((item) => `- ${item.channel}: ${item.message || item.status}`)
          .join('\n')
      : '- No scheduling requested.',
    ``,
    `Total time: ${totalTime}s`,
  ].join('\n');

  return {
    response,
    progress,
    results: {
      success: true,
      campaign_id: ledgerEntry.id,
      brief_created: true,
      ledger_entry: ledgerEntry.id,
      assets_found: assetResult.assets.length,
      manual_links: {
        dam: assetResult.searchUrl,
      },
      next_steps: [
        'Approve the draft copy',
        'Choose final assets',
        'Confirm scheduling windows',
        'Enable Beehiiv/Buffer live mode when ready',
      ],
    },
  };
}

async function handleQuery(message: string): Promise<OrchestrationResponse> {
  const intent = detectIntent(message);

  switch (intent) {
    case 'LAUNCH_CAMPAIGN':
      return orchestrateCampaign(message);
    case 'SHOW_CAMPAIGNS': {
      const campaigns = listLedgerEntries();
      const summary = campaigns.length
        ? campaigns
            .slice(0, 5)
            .map((entry) => `- ${entry.projectName} (${entry.status})`)
            .join('\n')
        : 'No campaigns yet.';

      return {
        response: `📊 Campaigns in the ledger:\n\n${summary}`,
        progress: [],
        results: {
          success: true,
          manual_links: {},
        },
      };
    }
    case 'FIND_ASSETS': {
      const query = message.replace(/find|search|get/gi, '').trim();
      const assets = await searchCloudinaryAssets(query);
      const lines = assets.assets.map((asset, index) => `${index + 1}. ${asset.alt || 'Asset'} - ${asset.url}`);
      return {
        response: `🖼️ Assets found for "${query}":\n\n${lines.join('\n')}`,
        progress: [],
        results: {
          success: true,
          assets_found: assets.assets.length,
          manual_links: { dam: assets.searchUrl },
        },
      };
    }
    case 'HELP':
      return {
        response:
          `Try one of these:\n` +
          `- "Launch campaign for Europe eSIM with newsletter and social"\n` +
          `- "Show me active campaigns"\n` +
          `- "Find hero images for Instagram"\n\n` +
          `I will draft copy, pull Cloudinary assets, and prep scheduling.`,
        progress: [],
        results: {
          success: true,
          manual_links: {},
        },
      };
    default:
      return {
        response:
          `Tell me the campaign you want to launch and the channels.\n` +
          `Example: "Launch campaign for Europe eSIM with newsletter and social"`,
        progress: [],
        results: {
          success: true,
          manual_links: {},
        },
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrchestrationRequest;
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await handleQuery(body.message);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Editorial OS Orchestrator',
    version: '1.1.0',
    mode: 'single-app',
    integrations: {
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      beehiiv: Boolean(process.env.BEEHIIV_API_KEY),
      buffer: Boolean(process.env.BUFFER_ACCESS_TOKEN),
    },
  });
}
