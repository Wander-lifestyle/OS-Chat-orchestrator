import { notionFetch } from '@/lib/notion';

export type EditorialOutputInput = {
  title: string;
  outputType: string;
  body: string;
  status?: string;
  skillsUsed?: string[];
  toolArtifacts?: Array<{ label: string; url: string }>;
};

export type EditorialOutputResult = {
  id: string;
  url?: string;
};

const TITLE_FIELD = process.env.NOTION_OUTPUTS_TITLE_FIELD || 'Title';
const TYPE_FIELD = process.env.NOTION_OUTPUTS_TYPE_FIELD || 'Output Type';
const STATUS_FIELD = process.env.NOTION_OUTPUTS_STATUS_FIELD || 'Status';
const STATUS_TYPE = process.env.NOTION_OUTPUTS_STATUS_TYPE || 'status';
const BODY_FIELD = process.env.NOTION_OUTPUTS_BODY_FIELD || 'Content';
const SKILLS_FIELD = process.env.NOTION_OUTPUTS_SKILLS_FIELD || 'Skills Used';
const ARTIFACTS_FIELD =
  process.env.NOTION_OUTPUTS_TOOL_ARTIFACTS_FIELD || 'Tool Artifacts';

export const createEditorialOutput = async (
  outputsDbId: string | undefined,
  input: EditorialOutputInput
): Promise<EditorialOutputResult> => {
  if (!outputsDbId) {
    throw new Error('Editorial Outputs database is missing for this client.');
  }

  const properties: Record<string, unknown> = {
    [TITLE_FIELD]: {
      title: [{ text: { content: input.title } }],
    },
    [TYPE_FIELD]: { select: { name: input.outputType } },
  };

  if (input.status) {
    properties[STATUS_FIELD] =
      STATUS_TYPE === 'select'
        ? { select: { name: input.status } }
        : { status: { name: input.status } };
  }

  if (input.skillsUsed && input.skillsUsed.length > 0) {
    properties[SKILLS_FIELD] = {
      multi_select: input.skillsUsed.map((skill) => ({ name: skill })),
    };
  }

  if (input.toolArtifacts && input.toolArtifacts.length > 0) {
    properties[ARTIFACTS_FIELD] = {
      rich_text: input.toolArtifacts.map((artifact) => ({
        text: { content: `${artifact.label}: ${artifact.url}` },
      })),
    };
  }

  const data = await notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: outputsDbId },
      properties,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: input.body } }],
          },
        },
      ],
    }),
  });

  return {
    id: data.id,
    url: data.url,
  };
};

export const updateEditorialOutput = async (
  pageId: string,
  updates: {
    status?: string;
    toolArtifacts?: Array<{ label: string; url: string }>;
  }
) => {
  const properties: Record<string, unknown> = {};

  if (updates.status) {
    properties[STATUS_FIELD] =
      STATUS_TYPE === 'select'
        ? { select: { name: updates.status } }
        : { status: { name: updates.status } };
  }

  if (updates.toolArtifacts && updates.toolArtifacts.length > 0) {
    properties[ARTIFACTS_FIELD] = {
      rich_text: updates.toolArtifacts.map((artifact) => ({
        text: { content: `${artifact.label}: ${artifact.url}` },
      })),
    };
  }

  if (Object.keys(properties).length === 0) {
    return;
  }

  await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
};
