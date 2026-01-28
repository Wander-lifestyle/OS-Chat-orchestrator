const NOTION_API_BASE = 'https://api.notion.com/v1';

const getNotionToken = () => {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error('NOTION_TOKEN is not configured.');
  }
  return token;
};

export const notionFetch = async (
  path: string,
  init: RequestInit = {}
) => {
  const token = getNotionToken();
  const response = await fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': process.env.NOTION_VERSION || '2022-06-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Notion API error (${response.status}): ${errorText || 'Unknown error.'}`
    );
  }

  return response.json();
};

type RichText = Array<{ plain_text?: string }>;

const richTextToString = (richText?: RichText) =>
  (richText || [])
    .map((item) => item.plain_text || '')
    .join('')
    .trim();

export const getPropertyText = (
  properties: Record<string, any>,
  key: string
) => {
  const property = properties[key];
  if (!property) return '';

  if (property.type === 'title') {
    return richTextToString(property.title);
  }
  if (property.type === 'rich_text') {
    return richTextToString(property.rich_text);
  }
  if (property.type === 'select') {
    return property.select?.name || '';
  }
  if (property.type === 'status') {
    return property.status?.name || '';
  }
  if (property.type === 'multi_select') {
    return (property.multi_select || [])
      .map((item: { name?: string }) => item.name)
      .filter(Boolean)
      .join(', ');
  }

  return '';
};

export const getPropertyTextArray = (
  properties: Record<string, any>,
  key: string
) => {
  const property = properties[key];
  if (!property) return [];

  if (property.type === 'multi_select') {
    return (property.multi_select || [])
      .map((item: { name?: string }) => item.name)
      .filter(Boolean);
  }
  if (property.type === 'relation') {
    return (property.relation || [])
      .map((item: { id?: string }) => item.id)
      .filter(Boolean);
  }
  return [];
};

export const listBlockChildren = async (blockId: string) => {
  const data = await notionFetch(`/blocks/${blockId}/children?page_size=100`);
  return data?.results || [];
};

export const blocksToPlainText = (blocks: Array<any>) =>
  blocks
    .map((block) => {
      const type = block.type;
      const richText = block[type]?.rich_text;
      const text = richTextToString(richText);
      return text;
    })
    .filter(Boolean)
    .join('\n');
