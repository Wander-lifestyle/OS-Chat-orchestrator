'use client';

import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

type DamSearchResponse = {
  query: string;
  total: number;
  assets: DamAsset[];
  next_cursor: string | null;
  error?: string;
  missing?: string[];
};

const EMPTY_RESULTS: DamSearchResponse = {
  query: '',
  total: 0,
  assets: [],
  next_cursor: null,
};

function formatBytes(bytes?: number) {
  if (!bytes || Number.isNaN(bytes)) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value?: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getField(asset: DamAsset, keys: string[]) {
  for (const key of keys) {
    if (asset.metadata[key]) return asset.metadata[key];
    if (asset.context[key]) return asset.context[key];
  }
  return undefined;
}

export default function LightDamPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DamSearchResponse>(EMPTY_RESULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAssets = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/dam/search?q=${encodeURIComponent(searchQuery)}`);
      const data = (await response.json()) as DamSearchResponse;
      if (!response.ok) {
        const message = data.error || 'Unable to load assets.';
        setError(message);
        setResults(data);
        return;
      }
      setResults(data);
    } catch (err) {
      console.error('DAM search failed:', err);
      setError('Unable to reach the DAM search service.');
      setResults(EMPTY_RESULTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssets('');
  }, [fetchAssets]);

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      void fetchAssets(query.trim());
    },
    [fetchAssets, query],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    void fetchAssets('');
  }, [fetchAssets]);

  const summary = useMemo(() => {
    if (isLoading) return 'Loading assets...';
    if (error) return 'Unable to load assets.';
    if (!results.query) return `${results.total} assets available`;
    return `${results.total} results for "${results.query}"`;
  }, [error, isLoading, results.query, results.total]);

  const connectionBadge = useMemo(() => {
    if (error) {
      return { label: 'Cloudinary not configured', color: 'bg-red-500' };
    }
    return { label: 'Cloudinary connected', color: 'bg-os-success' };
  }, [error]);

  return (
    <div className="min-h-screen bg-os-bg text-os-text">
      <div className="gradient-bg">
        <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-os-muted">Light DAM</p>
                <h1 className="text-4xl font-semibold tracking-tight">Searchable asset library</h1>
                <p className="text-sm text-os-muted">
                  Quick, human-friendly search over your Cloudinary-backed assets.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-os-muted">
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 shadow-sm">
                  <span className={`h-2 w-2 rounded-full ${connectionBadge.color}`} />
                  {connectionBadge.label}
                </span>
              </div>
            </div>
            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by campaign, tags, photographer, usage rights, or #image number"
                className="h-12 flex-1 rounded-xl border border-black/10 bg-white px-4 text-sm text-os-text placeholder:text-os-muted shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-os-accent px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-os-accent/30"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-xl border border-black/10 bg-white px-4 text-sm text-os-muted shadow-sm transition hover:text-os-text"
                >
                  Clear
                </button>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-os-muted">
              <span>{summary}</span>
              {results.query && (
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 shadow-sm">
                  Tip: try "image #1234" or "photographer Alex"
                </span>
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
            <div className="font-semibold">Light DAM is not configured yet.</div>
            <p className="mt-1 text-red-600">
              {error}
              {results.missing?.length ? ` Missing: ${results.missing.join(', ')}` : ''}
            </p>
          </div>
        )}

        {!error && results.assets.length === 0 && !isLoading && (
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-os-muted shadow-sm">
            No assets matched that search. Try different keywords or remove filters.
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-center text-sm text-os-muted shadow-sm">
            Searching your library...
          </div>
        )}

        {!isLoading && results.assets.length > 0 && (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {results.assets.map((asset) => {
              const photographer = getField(asset, ['photographer', 'creator', 'credit']);
              const usageRights = getField(asset, ['usage_rights', 'rights', 'license']);
              const campaign = getField(asset, ['campaign', 'project', 'collection']);
              const description = getField(asset, ['description', 'caption', 'alt']);
              return (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-square w-full overflow-hidden bg-os-bg">
                    <img
                      src={asset.preview_url}
                      alt={description || asset.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">{asset.filename}</h3>
                        <p className="text-xs text-os-muted">{asset.public_id}</p>
                      </div>
                      {asset.format && (
                        <span className="rounded-full border border-black/10 bg-os-bg px-2 py-1 text-[10px] uppercase text-os-muted">
                          {asset.format}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-os-muted">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-os-muted/70">Asset #</span>
                        <span className="text-os-text">{asset.asset_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-os-muted/70">Added</span>
                        <span className="text-os-text">{formatDate(asset.created_at)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-os-muted/70">Size</span>
                        <span className="text-os-text">{formatBytes(asset.bytes)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-os-muted/70">Dimensions</span>
                        <span className="text-os-text">
                          {asset.width && asset.height ? `${asset.width}x${asset.height}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-os-muted">
                      {campaign && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-os-muted/70">Campaign</span>
                          <div className="text-os-text">{campaign}</div>
                        </div>
                      )}
                      {photographer && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-os-muted/70">Photographer</span>
                          <div className="text-os-text">{photographer}</div>
                        </div>
                      )}
                      {usageRights && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wide text-os-muted/70">Usage Rights</span>
                          <div className="text-os-text">{usageRights}</div>
                        </div>
                      )}
                    </div>

                    {asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {asset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-black/10 bg-os-bg px-2 py-1 text-[10px] text-os-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2 text-xs">
                      {asset.secure_url && (
                        <a
                          href={asset.secure_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-os-text shadow-sm transition hover:bg-os-bg"
                        >
                          Open
                        </a>
                      )}
                      <a
                        href={asset.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-os-accent px-3 py-2 text-white shadow-sm transition hover:bg-blue-600"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
