import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

type SignatureRequest = {
  assetNumber?: string;
  photographer?: string;
  usageRights?: string;
  campaign?: string;
  description?: string;
  tags?: string;
  enableAutoTagging?: boolean;
};

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

function parseTags(value: string | null | undefined) {
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const configResult = configureCloudinary();
    if (!configResult.ok) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured.', missing: configResult.missing },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as SignatureRequest;
    const assetNumber = payload.assetNumber?.trim() ?? '';
    const photographer = payload.photographer?.trim() ?? '';
    const usageRights = payload.usageRights?.trim() ?? '';
    const campaign = payload.campaign?.trim() ?? '';
    const description = payload.description?.trim() ?? '';
    const tagsValue = parseTags(payload.tags).join(',');
    const enableAutoTagging = Boolean(payload.enableAutoTagging);

    const context = buildContext({
      asset_id: assetNumber,
      photographer,
      usage_rights: usageRights,
      campaign,
      description,
    });

    const folder = process.env.CLOUDINARY_FOLDER?.trim();
    const timestamp = Math.floor(Date.now() / 1000);

    const params: Record<string, string | number> = {
      timestamp,
    };
    if (folder) params.folder = folder;
    if (context) params.context = context;
    if (tagsValue) params.tags = tagsValue;
    if (enableAutoTagging) {
      params.auto_tagging = getAutoTaggingThreshold();
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET as string,
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: folder || null,
      context: context || null,
      tags: tagsValue || null,
      auto_tagging: enableAutoTagging ? params.auto_tagging : null,
    });
  } catch (error: any) {
    console.error('Signature error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create upload signature.' },
      { status: 500 },
    );
  }
}
