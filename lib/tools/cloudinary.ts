import { v2 as cloudinary } from 'cloudinary';
import { AssetResult, SearchAssetsInput } from '@/types/index';

const SAMPLE_ASSETS = [
  {
    id: 'demo/romance',
    url: 'https://res.cloudinary.com/demo/image/upload/w_1200,q_auto/lady.jpg',
    tags: ['romantic', 'lifestyle'],
    width: 1200,
    height: 800,
  },
  {
    id: 'demo/cafe',
    url: 'https://res.cloudinary.com/demo/image/upload/w_1200,q_auto/cafe.jpg',
    tags: ['travel', 'couples'],
    width: 1200,
    height: 800,
  },
  {
    id: 'demo/sunset',
    url: 'https://res.cloudinary.com/demo/image/upload/w_1200,q_auto/sunset.jpg',
    tags: ['romantic', 'getaway'],
    width: 1200,
    height: 800,
  },
];

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function searchAssets(
  input: SearchAssetsInput
): Promise<AssetResult> {
  if (!isConfigured()) {
    return {
      assets: SAMPLE_ASSETS.slice(0, input.limit || 3),
      source: 'sample',
    };
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const tagExpression =
    input.tags && input.tags.length > 0
      ? input.tags.map((tag) => `tags:${tag}`).join(' AND ')
      : '';
  const expression = tagExpression
    ? `${input.query} AND ${tagExpression}`
    : input.query;

  try {
    const result = await cloudinary.search
      .expression(expression)
      .sort_by('created_at', 'desc')
      .max_results(Math.min(input.limit || 5, 10))
      .execute();

    const assets = (result.resources || []).map((resource: any) => ({
      id: resource.public_id,
      url: resource.secure_url,
      tags: resource.tags || [],
      width: resource.width || 0,
      height: resource.height || 0,
    }));

    return {
      assets,
      source: 'cloudinary',
    };
  } catch (error) {
    console.error('Cloudinary search failed:', error);
    return {
      assets: SAMPLE_ASSETS.slice(0, input.limit || 3),
      source: 'sample',
    };
  }
}
