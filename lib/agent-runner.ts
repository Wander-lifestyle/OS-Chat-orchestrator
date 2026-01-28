import type { ContentBlock, MessageParam } from '@anthropic-ai/sdk/resources/messages';
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  getAnthropicClient,
} from '@/lib/anthropic';
import { fetchSkills, type SkillRecord } from '@/lib/notion-skills';
import { fetchBaseOS } from '@/lib/notion-base-os';
import { createEditorialOutput, updateEditorialOutput } from '@/lib/notion-outputs';
import { createLedgerEntry, updateLedgerEntry } from '@/lib/notion-ledger';
import { scheduleNewsletter } from '@/lib/beehiiv';
import { searchHeroImage } from '@/lib/cloudinary';
import { postNotification } from '@/lib/slack';
import { getClientConfig } from '@/lib/client-config';

export type AgentTrack = 'newsletter' | 'social' | 'press_release';

export type ToolActivity = {
  name: string;
  ok: boolean;
  summary: string;
  data?: Record<string, unknown>;
};

type RunAgentInput = {
  message: string;
  clientId?: string;
  track?: AgentTrack;
};

type RunAgentResult = {
  response: string;
  tools: ToolActivity[];
  records?: {
    outputUrl?: string;
    ledgerUrl?: string;
    ledgerStatus?: string;
  };
};

type AgentResultPayload = {
  output?: {
    title?: string;
    body?: string;
    output_type?: string;
  };
  skills_used?: string[];
  requirements?: Array<{
    tool: string;
    input?: Record<string, unknown>;
    approval_required?: boolean;
  }>;
};

const OUTPUT_STATUS_IN_REVIEW = process.env.EDITORIAL_OUTPUT_STATUS_IN_REVIEW || 'In Review';
const LEDGER_STATUS_IN_PROGRESS =
  process.env.EDITORIAL_LEDGER_STATUS_IN_PROGRESS || 'In Progress';
const LEDGER_STATUS_IN_REVIEW =
  process.env.EDITORIAL_LEDGER_STATUS_IN_REVIEW || 'In Review';
const LEDGER_STATUS_COMPLETED =
  process.env.EDITORIAL_LEDGER_STATUS_COMPLETED || 'Completed';
const SLACK_NOTIFICATION_CHANNEL = process.env.SLACK_NOTIFICATION_CHANNEL;

const extractText = (content: ContentBlock[]) =>
  content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

const buildSkillContext = (skills: SkillRecord[]) => {
  if (skills.length === 0) {
    return 'No active skills found for this client.';
  }

  return skills
    .map((skill) => {
      return [
        `Skill Name: ${skill.name || 'Untitled'}`,
        `Skill Type: ${skill.type || 'Unspecified'}`,
        `Trigger Condition: ${skill.trigger || 'None'}`,
        `Inputs Required: ${skill.inputsRequired || 'None'}`,
        `Skill Instructions: ${skill.instructions || 'None'}`,
        `Output Constraints: ${skill.outputConstraints || 'None'}`,
        `Requires Tools: ${skill.requiresTools.join(', ') || 'None'}`,
      ].join('\n');
    })
    .join('\n\n');
};

const SYSTEM_PROMPT = (baseOS: string, skillContext: string, track: AgentTrack) => `
You are the single Editorial OS v1 agent. You are deterministic, reviewable,
and client-safe. Notion is the system of record. Skills are the unit of
intelligence and must never execute tools. You decide which skills apply and
what requirements must be executed after generation.

Base OS (immutable):
${baseOS || 'No Base OS text provided.'}

Active Skills:
${skillContext}

Track in scope: ${track.replace('_', ' ')}.

Return ONLY JSON with this shape:
{
  "output": {
    "title": "string",
    "body": "string",
    "output_type": "Newsletter | Social | Press Release"
  },
  "skills_used": ["Skill Name"],
  "requirements": [
    {
      "tool": "schedule_beehiiv_newsletter | search_cloudinary_image | post_slack_notification",
      "input": { ... },
      "approval_required": true
    }
  ]
}

Rules:
- Always produce a draft output body.
- Set requirements only when needed.
- If scheduling is required, set approval_required=true.
- Never include tool calls or side effects in the output body.
`;

const parseAgentJson = (text: string): AgentResultPayload => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return {};
  }

  const jsonText = text.slice(start, end + 1);
  try {
    return JSON.parse(jsonText) as AgentResultPayload;
  } catch {
    return {};
  }
};

const normalizeTrack = (track?: AgentTrack): AgentTrack => {
  if (track === 'social' || track === 'press_release') return track;
  return 'newsletter';
};

export const runEditorialAgent = async ({
  message,
  clientId,
  track,
}: RunAgentInput): Promise<RunAgentResult> => {
  const clientConfig = getClientConfig(clientId);
  const client = getAnthropicClient();
  const resolvedTrack = normalizeTrack(track);

  const ledgerEntry = await createLedgerEntry({
    title: `Request: ${message.slice(0, 64)}`,
    summary: message,
    status: LEDGER_STATUS_IN_PROGRESS,
    databaseId: clientConfig.notion.ledgerDbId,
  });

  const baseOS = await fetchBaseOS(clientConfig.notion.baseOsPageId);
  const skills = await fetchSkills(clientConfig.notion.skillsDbId);
  const skillContext = buildSkillContext(skills);

  const systemPrompt = SYSTEM_PROMPT(baseOS, skillContext, resolvedTrack);
  const messages: MessageParam[] = [{ role: 'user', content: message }];

  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    system: systemPrompt,
    messages,
  });

  const text = extractText(response.content ?? []);
  const parsed = parseAgentJson(text);

  const outputTitle =
    parsed.output?.title || `${resolvedTrack.replace('_', ' ')} draft`;
  const outputBody = parsed.output?.body || text || message;
  const outputType =
    parsed.output?.output_type ||
    (resolvedTrack === 'press_release'
      ? 'Press Release'
      : resolvedTrack === 'social'
        ? 'Social'
        : 'Newsletter');
  const skillsUsed = Array.isArray(parsed.skills_used)
    ? parsed.skills_used
    : [];
  const requirements = Array.isArray(parsed.requirements)
    ? parsed.requirements
    : [];

  const outputRecord = await createEditorialOutput(
    clientConfig.notion.outputsDbId,
    {
      title: outputTitle,
      outputType,
      body: outputBody,
      status: OUTPUT_STATUS_IN_REVIEW,
      skillsUsed,
    }
  );

  await updateLedgerEntry(ledgerEntry.id, {
    status: LEDGER_STATUS_IN_REVIEW,
    summary: `Draft created: ${outputTitle}`,
    outputUrl: outputRecord.url,
    outputId: outputRecord.id,
  });

  const toolActivity: ToolActivity[] = [];
  const toolArtifacts: Array<{ label: string; url: string }> = [];
  let approvalRequired = false;
  let slackNotified = false;

  for (const requirement of requirements) {
    const toolName = requirement.tool;
    if (!toolName) continue;

    if (requirement.approval_required) {
      approvalRequired = true;
    }

    if (toolName === 'schedule_beehiiv_newsletter') {
      if (requirement.approval_required !== false) {
        toolActivity.push({
          name: toolName,
          ok: true,
          summary: 'Scheduling requested. Awaiting approval.',
        });
        continue;
      }

      try {
        const result = await scheduleNewsletter(requirement.input as any);
        toolActivity.push({
          name: toolName,
          ok: true,
          summary: result.summary,
          data: { id: result.id, status: result.status, url: result.url },
        });
        if (result.url) {
          toolArtifacts.push({ label: 'Beehiiv', url: result.url });
        }
      } catch (error) {
        toolActivity.push({
          name: toolName,
          ok: false,
          summary:
            error instanceof Error ? error.message : 'Beehiiv scheduling failed.',
        });
      }
      continue;
    }

    if (toolName === 'search_cloudinary_image') {
      try {
        const result = await searchHeroImage(requirement.input as any);
        toolActivity.push({
          name: toolName,
          ok: true,
          summary: result.summary,
          data: { id: result.id, url: result.url },
        });
        if (result.url) {
          toolArtifacts.push({ label: 'Cloudinary', url: result.url });
        }
      } catch (error) {
        toolActivity.push({
          name: toolName,
          ok: false,
          summary:
            error instanceof Error ? error.message : 'Cloudinary search failed.',
        });
      }
      continue;
    }

    if (toolName === 'post_slack_notification') {
      const channel =
        (requirement.input?.channel as string | undefined) ||
        SLACK_NOTIFICATION_CHANNEL;
      const message =
        (requirement.input?.message as string | undefined) ||
        `Editorial OS update: ${outputTitle}`;

      if (!channel) {
        toolActivity.push({
          name: toolName,
          ok: false,
          summary: 'Slack channel not configured.',
        });
        continue;
      }

      try {
        const result = await postNotification({
          channel,
          message,
        });
        toolActivity.push({
          name: toolName,
          ok: true,
          summary: result.summary,
          data: { id: result.id, status: result.status, channel: result.channel },
        });
        slackNotified = true;
      } catch (error) {
        toolActivity.push({
          name: toolName,
          ok: false,
          summary:
            error instanceof Error ? error.message : 'Slack notification failed.',
        });
      }
    }
  }

  if (toolArtifacts.length > 0) {
    await updateEditorialOutput(outputRecord.id, {
      toolArtifacts,
    });
  }

  await updateLedgerEntry(ledgerEntry.id, {
    status: approvalRequired ? LEDGER_STATUS_IN_REVIEW : LEDGER_STATUS_COMPLETED,
    summary: approvalRequired
      ? 'Draft ready for approval.'
      : 'Draft completed.',
  });

  if (SLACK_NOTIFICATION_CHANNEL && !slackNotified) {
    const summaryLines = [
      `Draft ready: ${outputTitle}`,
      `Track: ${outputType}`,
      outputRecord.url ? `Output: ${outputRecord.url}` : null,
      ledgerEntry.url ? `Ledger: ${ledgerEntry.url}` : null,
    ].filter(Boolean);

    try {
      const result = await postNotification({
        channel: SLACK_NOTIFICATION_CHANNEL,
        message: summaryLines.join('\n'),
      });
      toolActivity.push({
        name: 'post_slack_notification',
        ok: true,
        summary: result.summary,
        data: { id: result.id, status: result.status, channel: result.channel },
      });
    } catch (error) {
      toolActivity.push({
        name: 'post_slack_notification',
        ok: false,
        summary:
          error instanceof Error ? error.message : 'Slack notification failed.',
      });
    }
  }

  return {
    response: outputBody,
    tools: toolActivity,
    records: {
      outputUrl: outputRecord.url,
      ledgerUrl: ledgerEntry.url,
      ledgerStatus: approvalRequired ? LEDGER_STATUS_IN_REVIEW : LEDGER_STATUS_COMPLETED,
    },
  };
};
