import { blocksToPlainText, listBlockChildren } from '@/lib/notion';

export const fetchBaseOS = async (baseOsPageId?: string) => {
  if (!baseOsPageId) {
    return process.env.EDITORIAL_BASE_OS_TEXT || '';
  }

  const blocks = await listBlockChildren(baseOsPageId);
  const text = blocksToPlainText(blocks);
  return text || process.env.EDITORIAL_BASE_OS_TEXT || '';
};
