import { Buffer } from 'buffer';

export interface Asset {
  url: string;
  publicId?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface AssetSearchResult {
  assets: Asset[];
  source: 'cloudinary' | 'sample';
  searchUrl?: string;
  warning?: string;
}

const SAMPLE_ASSETS: Asset[] = [
  {
    url: 'https://res.cloudinary.com/demo/image/upload/w_1200,q_auto/sample.jpg',
    publicId: 'demo/sample',
    alt: 'Lifestyle travel sample',
  },
  {
    url: 'https://res.cloudinary.com/demo/image/upload/w_1200,q_auto/kitten_fighting.jpg',
    publicId: 'demo/kitten_fighting',
    alt: 'Playful lifestyle sample',
  },
  {
    url: 'https://res.cloudinary.com/demo/image/upload/w_1200,q_auto/surf.jpg',
    publicId: 'demo/surf',
    alt: 'Action travel sample',
  },
];

function buildBasicAuth(apiKey: string, apiSecret: string) {
  return Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
}

function sanitizeQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim();
}

export async function searchCloudinaryAssets(
  query: string,
  maxResults = 5
): Promise<AssetSearchResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      assets: SAMPLE_ASSETS.slice(0, maxResults),
      source: 'sample',
      warning: 'Cloudinary not configured. Showing sample assets.',
    };
  }

  const safeQuery = sanitizeQuery(query);
  const expression = safeQuery
    ? `resource_type:image AND tags:${safeQuery.replace(/\s+/g, '_')}`
    : 'resource_type:image';

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${buildBasicAuth(apiKey, apiSecret)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expression,
        max_results: maxResults,
      }),
    }
  );

  if (!response.ok) {
    return {
      assets: SAMPLE_ASSETS.slice(0, maxResults),
      source: 'sample',
      warning: `Cloudinary search failed (${response.status}). Showing sample assets.`,
    };
  }

  const data = await response.json();
  const assets = (data.resources || []).map((resource: any) => ({
    url: resource.secure_url,
    publicId: resource.public_id,
    alt: resource.context?.custom?.alt || resource.filename || 'Cloudinary asset',
    width: resource.width,
    height: resource.height,
  }));

  if (assets.length === 0) {
    return {
      assets: SAMPLE_ASSETS.slice(0, maxResults),
      source: 'sample',
      warning: 'No Cloudinary matches found. Showing sample assets.',
    };
  }

  const searchUrl = `https://console.cloudinary.com/console/media_library/search?q=${encodeURIComponent(
    safeQuery || ''
  )}`;

  return {
    assets,
    source: 'cloudinary',
    searchUrl,
  };
}
