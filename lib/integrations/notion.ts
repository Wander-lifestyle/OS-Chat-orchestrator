import { Client } from '@notionhq/client';

interface BriefPayload {
  brief_id: string;
  name: string;
  objective: string;
  target_audience: string;
  core_message: string;
  key_benefits?: string[] | null;
  channels?: string[] | null;
}

function getTitlePropertyKey(properties: Record<string, any>) {
  const entry = Object.entries(properties).find(([, value]) => value?.type === 'title');
  return entry?.[0] || 'Name';
}

function findPropertyKey(properties: Record<string, any>, aliases: string[]) {
  const lowerAliases = aliases.map((alias) => alias.toLowerCase());
  return (
    Object.keys(properties).find((key) => lowerAliases.includes(key.toLowerCase())) || null
  );
}

function setRichTextProperty(
  target: Record<string, any>,
  key: string | null,
  value: string | null | undefined,
  properties: Record<string, any>
) {
  if (!key || !value) return;
  const property = properties[key];
  if (!property) return;
  if (property.type === 'rich_text') {
    target[key] = { rich_text: [{ text: { content: value } }] };
  }
  if (property.type === 'title') {
    target[key] = { title: [{ text: { content: value } }] };
  }
}

function setMultiSelectProperty(
  target: Record<string, any>,
  key: string | null,
  values: string[] | null | undefined,
  properties: Record<string, any>
) {
  if (!key || !values || values.length === 0) return;
  const property = properties[key];
  if (!property) return;
  if (property.type === 'multi_select') {
    target[key] = { multi_select: values.map((value) => ({ name: value })) };
  }
  if (property.type === 'select') {
    target[key] = { select: { name: values[0] } };
  }
}

function buildChildren(brief: BriefPayload) {
  return [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Objective' } }] },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: brief.objective } }] },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Target Audience' } }] },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: brief.target_audience } }],
      },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Core Message' } }] },
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: brief.core_message } }],
      },
    },
    ...(brief.key_benefits && brief.key_benefits.length > 0
      ? [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: { rich_text: [{ type: 'text', text: { content: 'Key Benefits' } }] },
          },
          ...brief.key_benefits.map((benefit) => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: benefit } }],
            },
          })),
        ]
      : []),
  ];
}

export async function createNotionBriefPage({
  token,
  databaseId,
  brief,
}: {
  token: string;
  databaseId: string;
  brief: BriefPayload;
}) {
  try {
    const notion = new Client({ auth: token });
    const database = await notion.databases.retrieve({ database_id: databaseId });
    const properties = database.properties || {};
    const titleKey = getTitlePropertyKey(properties);

    const payload: Record<string, any> = {
      [titleKey]: { title: [{ text: { content: brief.name } }] },
    };

    setRichTextProperty(
      payload,
      findPropertyKey(properties, ['Brief ID', 'Brief Id', 'BriefID', 'ID']),
      brief.brief_id,
      properties
    );
    setRichTextProperty(
      payload,
      findPropertyKey(properties, ['Objective', 'Goal']),
      brief.objective,
      properties
    );
    setRichTextProperty(
      payload,
      findPropertyKey(properties, ['Audience', 'Target Audience']),
      brief.target_audience,
      properties
    );
    setRichTextProperty(
      payload,
      findPropertyKey(properties, ['Core Message', 'Key Message', 'Message']),
      brief.core_message,
      properties
    );
    setMultiSelectProperty(
      payload,
      findPropertyKey(properties, ['Channels', 'Channel']),
      brief.channels || [],
      properties
    );

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: payload,
      children: buildChildren(brief),
    });

    return { success: true, pageId: page.id, url: page.url };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Notion request failed' };
  }
}

export async function testNotionConnection({
  token,
  databaseId,
}: {
  token: string;
  databaseId: string;
}) {
  try {
    const notion = new Client({ auth: token });
    const database = await notion.databases.retrieve({ database_id: databaseId });
    return {
      success: true,
      databaseName: database?.title?.[0]?.plain_text || 'Notion database',
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Notion test failed' };
  }
}
