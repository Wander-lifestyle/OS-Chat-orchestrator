export type CloudinarySearchInput = {
  query: string;
  tags?: string[];
  orientation?: string;
};

import { fetchWithTimeout } from '@/lib/http';

export type CloudinarySearchResult = {
  id: string;
  url?: string;
  summary: string;
};

export async function searchHeroImage(
  input: CloudinarySearchInput
): Promise<CloudinarySearchResult> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  const safeQuery = input.query.replace(/"/g, '\\"');
  const expressionParts = [
    'resource_type:image',
    `(tags:"${safeQuery}" OR filename:"${safeQuery}")`,
  ];

  if (input.tags && input.tags.length > 0) {
    input.tags.forEach((tag) => {
      expressionParts.push(`tags:"${tag.replace(/"/g, '\\"')}"`);
    });
  }

  const response = await fetchWithTimeout(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString(
          'base64'
        )}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expression: expressionParts.join(' AND '),
        max_results: 1,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudinary API error (${response.status}): ${errorText || 'Unknown error.'}`
    );
  }

  const data = await response.json();
  const resource = data?.resources?.[0];

  if (!resource) {
    return {
      id: 'cloudinary-none',
      summary: `No Cloudinary images found for "${input.query}".`,
    };
  }

  return {
    id: resource.public_id || `cloudinary-${Date.now()}`,
    url: resource.secure_url,
    summary: `Hero image found for "${input.query}".`,
  };
}
