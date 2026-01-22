'use client';

import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  ai_tag_confidence?: Record<string, number>;
};

type DamSearchResponse = {
  query: string;
  total: number;
  assets: DamAsset[];
  next_cursor: string | null;
  error?: string;
  missing?: string[];
};

type UploadResponse = {
  success?: boolean;
  error?: string;
  missing?: string[];
  uploaded?: number;
  failed?: number;
  warnings?: string[];
  errors?: Array<{ fileName: string; error: string }>;
  assets?: Array<{
    public_id: string;
    tags?: string[];
    ai_tag_confidence?: Record<string, number>;
  }>;
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
  const [activeQuery, setActiveQuery] = useState('');
  const [isSemanticSearch, setIsSemanticSearch] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<Array<{ fileName: string; error: string }>>([]);
  const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFields, setUploadFields] = useState({
    assetNumber: '',
    photographer: '',
    usageRights: '',
    campaign: '',
    description: '',
    tags: '',
  });
  const [enableAutoTagging, setEnableAutoTagging] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async (
    searchQuery: string,
    modeOverride?: 'semantic' | 'strict',
  ) => {
    setActiveQuery(searchQuery);
    setIsLoading(true);
    setError('');
    try {
      const mode = modeOverride ?? (isSemanticSearch ? 'semantic' : 'strict');
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      params.set('mode', mode);
      const response = await fetch(`/api/dam/search?${params.toString()}`);
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
  }, [isSemanticSearch]);

  useEffect(() => {
    void fetchAssets('');
  }, [fetchAssets]);

  useEffect(() => {
    if (uploadFiles.length > 1 && uploadFields.assetNumber) {
      setUploadFields((prev) => ({ ...prev, assetNumber: '' }));
    }
  }, [uploadFiles.length, uploadFields.assetNumber]);

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

  const handleSearchModeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.checked;
    setIsSemanticSearch(nextValue);
    void fetchAssets(activeQuery, nextValue ? 'semantic' : 'strict');
  }, [activeQuery, fetchAssets]);

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    setUploadFiles((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const nextFiles = files.filter((file) => {
        if (!file.type.startsWith('image/')) return false;
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
      return [...prev, ...nextFiles];
    });
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadTags([]);
    setUploadErrors([]);
    setUploadWarnings([]);
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    addFiles(files);
    if (event.target.value) {
      event.target.value = '';
    }
  }, [addFiles]);

  const removeUploadFile = useCallback((index: number) => {
    setUploadFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    addFiles(files);
  }, [addFiles]);

  const handleUploadSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (uploadFiles.length === 0 || uploadStatus === 'uploading') {
      setUploadStatus('error');
      setUploadMessage('Select an image before uploading.');
      return;
    }

    setUploadStatus('uploading');
    setUploadMessage('');
    setUploadTags([]);
    setUploadErrors([]);
    setUploadWarnings([]);

    try {
      const formData = new FormData();
      uploadFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('assetNumber', uploadFields.assetNumber);
      formData.append('photographer', uploadFields.photographer);
      formData.append('usageRights', uploadFields.usageRights);
      formData.append('campaign', uploadFields.campaign);
      formData.append('description', uploadFields.description);
      formData.append('tags', uploadFields.tags);
      formData.append('enableAutoTagging', String(enableAutoTagging));

      const response = await fetch('/api/dam/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as UploadResponse;
      if (!response.ok) {
        setUploadStatus('error');
        setUploadMessage(data.error || 'Upload failed.');
        setUploadErrors(data.errors ?? []);
        return;
      }

      const uploaded = data.uploaded ?? data.assets?.length ?? 0;
      const failed = data.failed ?? 0;
      if (uploaded > 0) {
        setUploadStatus('success');
        setUploadMessage(`Uploaded ${uploaded} asset${uploaded === 1 ? '' : 's'}.${failed ? ` ${failed} failed.` : ''}`);
      } else {
        setUploadStatus('error');
        setUploadMessage(data.error || 'Upload failed.');
      }
      const tagList = data.assets?.flatMap((asset) => asset.tags ?? []) ?? [];
      const uniqueTags = Array.from(new Set(tagList)).slice(0, 12);
      setUploadTags(uniqueTags);
      setUploadErrors(data.errors ?? []);
      setUploadWarnings(data.warnings ?? []);
      setUploadFiles([]);
      setUploadFields((prev) => ({
        ...prev,
        description: '',
        tags: '',
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      void fetchAssets(activeQuery, isSemanticSearch ? 'semantic' : 'strict');
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadStatus('error');
      setUploadMessage('Unable to upload asset right now.');
    }
  }, [
    activeQuery,
    enableAutoTagging,
    fetchAssets,
    isSemanticSearch,
    uploadFields,
    uploadFiles,
    uploadStatus,
  ]);

  const summary = useMemo(() => {
    if (isLoading) return 'Loading assets...';
    if (error) return 'Unable to load assets.';
    const base = !results.query
      ? `${results.total} assets available`
      : `${results.total} results for "${results.query}"`;
    return isSemanticSearch ? `${base} • AI search` : base;
  }, [error, isLoading, isSemanticSearch, results.query, results.total]);

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
              <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 shadow-sm">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isSemanticSearch}
                  onChange={handleSearchModeChange}
                />
                <span className="relative inline-flex h-4 w-7 items-center rounded-full bg-black/10 transition peer-checked:bg-os-accent">
                  <span className="inline-block h-3 w-3 translate-x-0 rounded-full bg-white shadow transition peer-checked:translate-x-3.5" />
                </span>
                <span className="text-os-text">AI search</span>
              </label>
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

        <section className="mb-10 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Upload new asset</h2>
              <p className="text-sm text-os-muted">
                Add metadata so your team can search by campaign, usage rights, or photographer.
              </p>
            </div>
            <span className="text-xs text-os-muted">AI tagging is optional.</span>
          </div>

          <form onSubmit={handleUploadSubmit} className="mt-6 grid gap-5">
            <label
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-os-bg/60 text-center text-sm text-os-muted transition ${
                dragActive ? 'border-os-accent bg-blue-50/80' : 'border-black/20'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
              <span className="text-sm font-medium text-os-text">
                {uploadFiles.length > 0
                  ? `${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'} ready`
                  : 'Drop images here or click to browse'}
              </span>
              <span className="text-xs text-os-muted">PNG, JPG, or WebP. Recommended under 15MB each.</span>
            </label>

            {uploadFiles.length > 0 && (
              <div className="grid gap-2 text-xs text-os-muted">
                {uploadFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-3 py-2 shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-medium text-os-text">{file.name}</div>
                      <div className="text-[11px] text-os-muted">{formatBytes(file.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUploadFile(index)}
                      className="text-xs text-os-muted hover:text-os-text"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-xs text-os-muted">
                <span className="uppercase tracking-wide">Asset #</span>
                <input
                  value={uploadFields.assetNumber}
                  onChange={(event) => setUploadFields((prev) => ({
                    ...prev,
                    assetNumber: event.target.value,
                  }))}
                  placeholder={uploadFiles.length > 1 ? 'Asset # disabled for multi-upload' : 'e.g. 1234'}
                  disabled={uploadFiles.length > 1}
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-os-text shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20 disabled:bg-os-bg disabled:text-os-muted"
                />
              </label>
              <label className="grid gap-2 text-xs text-os-muted">
                <span className="uppercase tracking-wide">Campaign</span>
                <input
                  value={uploadFields.campaign}
                  onChange={(event) => setUploadFields((prev) => ({
                    ...prev,
                    campaign: event.target.value,
                  }))}
                  placeholder="Spring launch, EU campaign, etc."
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-os-text shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20"
                />
              </label>
              <label className="grid gap-2 text-xs text-os-muted">
                <span className="uppercase tracking-wide">Photographer</span>
                <input
                  value={uploadFields.photographer}
                  onChange={(event) => setUploadFields((prev) => ({
                    ...prev,
                    photographer: event.target.value,
                  }))}
                  placeholder="Alex Rivera"
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-os-text shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20"
                />
              </label>
              <label className="grid gap-2 text-xs text-os-muted">
                <span className="uppercase tracking-wide">Usage rights</span>
                <input
                  value={uploadFields.usageRights}
                  onChange={(event) => setUploadFields((prev) => ({
                    ...prev,
                    usageRights: event.target.value,
                  }))}
                  placeholder="Global paid social, 1 year usage, etc."
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-os-text shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20"
                />
              </label>
            </div>

            <label className="grid gap-2 text-xs text-os-muted">
              <span className="uppercase tracking-wide">Tags</span>
              <input
                value={uploadFields.tags}
                onChange={(event) => setUploadFields((prev) => ({
                  ...prev,
                  tags: event.target.value,
                }))}
                placeholder="hero, summer, product, lifestyle"
                className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm text-os-text shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20"
              />
            </label>

            <label className="grid gap-2 text-xs text-os-muted">
              <span className="uppercase tracking-wide">Description</span>
              <textarea
                value={uploadFields.description}
                onChange={(event) => setUploadFields((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))}
                placeholder="Short description to help with search."
                rows={3}
                className="resize-none rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-os-text shadow-sm focus:border-os-accent focus:outline-none focus:ring-2 focus:ring-os-accent/20"
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-xs text-os-muted">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={enableAutoTagging}
                  onChange={(event) => setEnableAutoTagging(event.target.checked)}
                />
                <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-black/10 transition peer-checked:bg-os-accent">
                  <span className="inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                </span>
                <span className="text-os-text">AI auto-tagging</span>
                <span>Adds smart tags on upload.</span>
              </label>
              <button
                type="submit"
                disabled={uploadStatus === 'uploading' || uploadFiles.length === 0}
                className="h-11 rounded-xl bg-os-accent px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-black/20"
              >
                {uploadStatus === 'uploading'
                  ? 'Uploading...'
                  : `Upload ${uploadFiles.length > 1 ? `${uploadFiles.length} assets` : 'asset'}`}
              </button>
            </div>

            {uploadStatus !== 'idle' && uploadMessage && (
              <div
                className={`rounded-2xl border px-4 py-3 text-xs ${
                  uploadStatus === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : uploadStatus === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}
              >
                <div className="font-medium">{uploadMessage}</div>
                {uploadTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadTags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] text-os-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {uploadErrors.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-red-600">
                    {uploadErrors.map((item) => (
                      <li key={`${item.fileName}-${item.error}`}>{item.fileName}: {item.error}</li>
                    ))}
                  </ul>
                )}
                {uploadWarnings.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-700">
                    {uploadWarnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </form>
        </section>

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
              const aiTagEntries = Object.entries(asset.ai_tag_confidence ?? {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);
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

                    {aiTagEntries.length > 0 && (
                      <div className="space-y-2 text-xs text-os-muted">
                        <span className="text-[10px] uppercase tracking-wide text-os-muted/70">
                          AI tag confidence
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {aiTagEntries.map(([tag, confidence]) => (
                            <span
                              key={`${asset.id}-${tag}`}
                              className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] text-os-text"
                            >
                              {tag} {Math.round(confidence * 100)}%
                            </span>
                          ))}
                        </div>
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
