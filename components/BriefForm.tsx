'use client';

import { useEffect, useMemo, useState } from 'react';

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social' },
  { value: 'blog', label: 'Blog' },
  { value: 'landing', label: 'Landing page' },
];

interface BriefResponse {
  success: boolean;
  file_name: string;
  pdf_base64: string;
  slack: { success: boolean; error?: string };
}

export default function BriefForm() {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [coreMessage, setCoreMessage] = useState('');
  const [keyBenefits, setKeyBenefits] = useState('');
  const [channels, setChannels] = useState<string[]>(['email', 'social']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BriefResponse | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const benefits = useMemo(
    () =>
      keyBenefits
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [keyBenefits]
  );

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const toggleChannel = (value: string) => {
    setChannels((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = async () => {
    if (!name || !objective || !audience || !coreMessage) {
      setError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          objective,
          target_audience: audience,
          core_message: coreMessage,
          key_benefits: benefits,
          channels,
        }),
      });

      const data = (await response.json()) as BriefResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create brief');
      }

      const binary = atob(data.pdf_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brief');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Campaign name *
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-teal-200 focus:ring-2 focus:ring-teal-100"
            placeholder="Q2 Product Launch"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Objective *
          </label>
          <input
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-teal-200 focus:ring-2 focus:ring-teal-100"
            placeholder="Drive 25% signup growth"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Target audience *
          </label>
          <input
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-teal-200 focus:ring-2 focus:ring-teal-100"
            placeholder="Growth marketers at SaaS teams"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Core message *
          </label>
          <input
            value={coreMessage}
            onChange={(event) => setCoreMessage(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-teal-200 focus:ring-2 focus:ring-teal-100"
            placeholder="OS Brief helps teams ship campaigns faster."
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">
          Key benefits (one per line)
        </label>
        <textarea
          value={keyBenefits}
          onChange={(event) => setKeyBenefits(event.target.value)}
          className="mt-2 h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-teal-200 focus:ring-2 focus:ring-teal-100"
          placeholder="Faster approvals\nClearer alignment\nSingle source of truth"
        />
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-[0.2em] text-zinc-400">Channels</label>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => toggleChannel(option.value)}
              className={`rounded-full border px-4 py-1 text-xs transition ${
                channels.includes(option.value)
                  ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-5 text-sm text-red-500">{error}</div>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? 'Sending…' : 'Send brief'}
        </button>
        <span className="text-xs text-zinc-400">
          Sends summary + PDF to Slack and prepares a download.
        </span>
      </div>

      {result && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <div className="text-zinc-800">Brief sent to Slack.</div>
          <div className="mt-1 text-xs text-zinc-500">
            Slack status:{' '}
            {result.slack.success
              ? 'Delivered with PDF attachment'
              : `Failed${result.slack.error ? `: ${result.slack.error}` : ''}`}
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={result.file_name}
              className="mt-4 inline-flex items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-700 hover:border-zinc-300"
            >
              Download PDF
            </a>
          )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Preview</div>
        <div className="mt-3 space-y-2 text-sm text-zinc-600">
          <div className="font-medium text-zinc-900">{name || 'Campaign name'}</div>
          <div>
            <span className="text-zinc-400">Objective:</span> {objective || '—'}
          </div>
          <div>
            <span className="text-zinc-400">Audience:</span> {audience || '—'}
          </div>
          <div>
            <span className="text-zinc-400">Core message:</span> {coreMessage || '—'}
          </div>
          <div>
            <span className="text-zinc-400">Channels:</span>{' '}
            {channels.length ? channels.join(', ') : '—'}
          </div>
          {benefits.length > 0 && (
            <ul className="list-disc pl-5 text-zinc-500">
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
