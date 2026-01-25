export type CloudinarySearchInput = {
  query: string;
  tags?: string[];
  orientation?: string;
};

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
    return {
      id: 'cloudinary-unconfigured',
      summary:
        'Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    };
  }

  // TODO: Implement Cloudinary search. For now, return a stubbed response.
  return {
    id: `cloudinary-${Date.now()}`,
    url: `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`,
    summary: `Found a placeholder hero image for "${input.query}".`,
  };
}
