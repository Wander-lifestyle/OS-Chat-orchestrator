import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

type DamSearchRequest = {
  query?: string;
  cursor?: string;
  limit?: number;
};

type DamAsset = {
  id: string;
  public_id: string;
  asset_id?: string;
  asset_number?: string;
  filename: string;
  folder?: string | null;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  created_at?: string;
  tags: string[];
  context: Record<string, string>;
  metadata: Record<string, string>;
  secure_url?: string;
  preview_url: string;
  download_url: string;
};

const DEFAULT_LIMIT = 48;
const MAX_LIMIT = 100;
const MAX_FETCH = 100; // Light DAM targets small libraries (20-50 assets)

const STOPWORDS = new Set([
  'a', 'an', 'the', 'for', 'to', 'and', 'or', 'with', 'of', 'in', 'on', 'at',
  'from', 'by', 'is', 'are', 'be', 'this', 'that', 'these', 'those', 'show',
  'find', 'search', 'get', 'need', 'looking',
]);

const REQUIRED_ENV = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

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

function escapeExpressionValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const escaped = trimmed.replace(/"/g, '\\"');
  return /\s/.test(escaped) ? `"${escaped}"` : escaped;
}

function normalizeRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const record = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  Object.entries(record).forEach(([key, entry]) => {
    if (entry === null || entry === undefined) return;
    result[key] = String(entry);
  });
  return result;
}

function normalizeContext(context: unknown): Record<string, string> {
  if (!context || typeof context !== 'object') return {};
  const ctx = context as { custom?: Record<string, unknown> } & Record<string, unknown>;
  return normalizeRecord(ctx.custom ?? ctx);
}

function parseQuery(rawQuery: string) {
  const normalized = rawQuery.toLowerCase();
  const idMatch = normalized.match(/(?:^|\s)(?:#|image\s*#?|asset\s*#?|id\s*#?)(\d+)/);
  const assetId = idMatch?.[1];
  const terms = normalized
    .replace(/[^a-z0-9#\s_-]/g, ' ')
    .split(/\s+/)
    .map((term) => term.replace(/^#+/, ''))
    .filter(Boolean)
    .filter((term) => !STOPWORDS.has(term))
    .filter((term) => term !== assetId)
    .slice(0, 8);

  return { assetId, terms };
}

function buildSearchableText(asset: {
  asset_id?: string;
  public_id: string;
  filename?: string;
  tags?: string[];
  context?: unknown;
  metadata?: unknown;
  format?: string;
}) {
  const context = normalizeContext(asset.context);
  const metadata = normalizeRecord(asset.metadata);
  const parts: string[] = [
    asset.asset_id,
    asset.public_id,
    asset.filename,
    asset.format,
    ...(asset.tags ?? []),
    ...Object.values(context),
    ...Object.values(metadata),
  ].filter(Boolean) as string[];

  return parts.join(' ').toLowerCase();
}

function matchesQuery(
  asset: Parameters<typeof buildSearchableText>[0],
  query: { assetId?: string; terms: string[] },
) {
  if (!query.assetId && query.terms.length === 0) return true;
  const searchable = buildSearchableText(asset);

  if (query.assetId) {
    return searchable.includes(query.assetId);
  }

  return query.terms.every((term) => searchable.includes(term));
}

function buildPreviewUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    type: 'upload',
    transformation: [
      {
        width: 480,
        height: 480,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  });
}

function buildDownloadUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    type: 'upload',
    flags: 'attachment',
  });
}

function mapAsset(asset: any): DamAsset {
  const context = normalizeContext(asset.context);
  const metadata = normalizeRecord(asset.metadata);
  const assetNumber =
    metadata.asset_id ||
    context.asset_id ||
    metadata.assetId ||
    context.assetId;

  const filename =
    asset.filename || asset.public_id?.split('/').pop() || asset.public_id;

  return {
    id: asset.asset_id || asset.public_id,
    public_id: asset.public_id,
    asset_id: asset.asset_id,
    asset_number: assetNumber,
    filename,
    folder: asset.folder ?? null,
    format: asset.format,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes,
    created_at: asset.created_at,
    tags: asset.tags ?? [],
    context,
    metadata,
    secure_url: asset.secure_url,
    preview_url: buildPreviewUrl(asset.public_id),
    download_url: buildDownloadUrl(asset.public_id),
  };
}

async function runSearch(request: NextRequest) {
  const isPost = request.method === 'POST';
  const payload = isPost ? ((await request.json()) as DamSearchRequest) : null;
  const query = payload?.query ?? request.nextUrl.searchParams.get('q') ?? '';
  const cursor =
    payload?.cursor ?? request.nextUrl.searchParams.get('cursor') ?? undefined;
  const requestedLimit = Number(payload?.limit ?? request.nextUrl.searchParams.get('limit'));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const missing = getMissingEnv();
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'Cloudinary is not configured.',
        missing,
        query,
        total: 0,
        assets: [],
        next_cursor: null,
      },
      { status: 500 },
    );
  }

  const configResult = configureCloudinary();
  if (!configResult.ok) {
    return NextResponse.json(
      {
        error: 'Cloudinary is not configured.',
        missing: configResult.missing,
        query,
        total: 0,
        assets: [],
        next_cursor: null,
      },
      { status: 500 },
    );
  }
  }

  const folder = process.env.CLOUDINARY_FOLDER?.trim();
  const folderExpression = folder ? ` AND folder:${escapeExpressionValue(folder)}` : '';
  const expression = `resource_type:image AND type:upload${folderExpression}`;

  const searchQuery = cloudinary.search
    .expression(expression)
    .sort_by('created_at', 'desc')
    .with_field('context')
    .with_field('metadata')
    .max_results(MAX_FETCH);

  if (cursor) {
    searchQuery.next_cursor(cursor);
  }

  const result = await searchQuery.execute();
  const parsedQuery = parseQuery(query);
  const filtered = (result.resources ?? []).filter((asset: any) =>
    matchesQuery(
      {
        asset_id: asset.asset_id,
        public_id: asset.public_id,
        filename: asset.filename,
        tags: asset.tags,
        context: asset.context,
        metadata: asset.metadata,
        format: asset.format,
      },
      parsedQuery,
    ),
  );

  const assets = filtered.slice(0, limit).map(mapAsset);

  return NextResponse.json({
    query,
    total: filtered.length,
    assets,
    next_cursor: result.next_cursor ?? null,
  });
}

export async function POST(request: NextRequest) {
  try {
    return await runSearch(request);
  } catch (error) {
    console.error('DAM search error:', error);
    return NextResponse.json(
      { error: 'Failed to search assets.' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return await runSearch(request);
  } catch (error) {
    console.error('DAM search error:', error);
    return NextResponse.json(
      { error: 'Failed to search assets.' },
      { status: 500 },
    );
  }
}
