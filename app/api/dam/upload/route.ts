import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

const REQUIRED_ENV = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const DEFAULT_AUTO_TAGGING_THRESHOLD = 0.6;

function getMissingEnv() {
  return REQUIRED_ENV.filter((name) => !process.env[name]);
}

function configureCloudinary() {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    return { ok: false, missing };
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return { ok: true, missing: [] as string[] };
}

function sanitizeContextValue(value: string) {
  return value.replace(/[|=]/g, ' ').trim();
}

function buildContext(fields: Record<string, string>) {
  const entries = Object.entries(fields)
    .map(([key, value]) => [key, sanitizeContextValue(value)] as const)
    .filter(([, value]) => value.length > 0);

  if (entries.length === 0) return undefined;
  return entries.map(([key, value]) => `${key}=${value}`).join('|');
}

function parseTags(value: string | null) {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function getAutoTaggingThreshold() {
  const raw = process.env.CLOUDINARY_AUTO_TAGGING_THRESHOLD;
  if (!raw) return DEFAULT_AUTO_TAGGING_THRESHOLD;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_AUTO_TAGGING_THRESHOLD;
  return Math.min(Math.max(parsed, 0.1), 0.95);
}

function uploadBuffer(buffer: Buffer, options: Record<string, unknown>) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const configResult = configureCloudinary();
    if (!configResult.ok) {
      return NextResponse.json(
        {
          error: 'Cloudinary is not configured.',
          missing: configResult.missing,
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'An image file is required.' },
        { status: 400 },
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image uploads are supported.' },
        { status: 400 },
      );
    }

    const assetNumber = (formData.get('assetNumber') as string | null)?.trim() ?? '';
    const photographer = (formData.get('photographer') as string | null)?.trim() ?? '';
    const usageRights = (formData.get('usageRights') as string | null)?.trim() ?? '';
    const campaign = (formData.get('campaign') as string | null)?.trim() ?? '';
    const description = (formData.get('description') as string | null)?.trim() ?? '';
    const tags = parseTags((formData.get('tags') as string | null) ?? '');
    const enableAutoTagging = formData.get('enableAutoTagging') === 'true';

    const context = buildContext({
      asset_id: assetNumber,
      photographer,
      usage_rights: usageRights,
      campaign,
      description,
    });

    const folder = process.env.CLOUDINARY_FOLDER?.trim();
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadOptions: Record<string, unknown> = {
      folder: folder || undefined,
      context,
      tags,
      resource_type: 'image',
    };

    if (enableAutoTagging) {
      uploadOptions.auto_tagging = getAutoTaggingThreshold();
    }

    const result = (await uploadBuffer(buffer, uploadOptions)) as {
      asset_id?: string;
      public_id: string;
      secure_url?: string;
      bytes?: number;
      width?: number;
      height?: number;
      format?: string;
      created_at?: string;
      tags?: string[];
      context?: Record<string, unknown>;
    };

    return NextResponse.json({
      success: true,
      asset: {
        asset_id: result.asset_id,
        public_id: result.public_id,
        secure_url: result.secure_url,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        format: result.format,
        created_at: result.created_at,
        tags: result.tags ?? tags,
        context: result.context ?? {},
      },
    });
  } catch (error: any) {
    console.error('DAM upload error:', error);
    const message =
      typeof error?.message === 'string'
        ? error.message
        : 'Failed to upload asset.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
