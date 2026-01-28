'use client';

import { useState } from 'react';

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social' },
  { value: 'blog', label: 'Blog' },
  { value: 'landing', label: 'Landing page' },
];

interface CreateBriefResponse {
  brief: {
    id: string;
    brief_id: string;
    name: string;
    objective: string;
    target_audience: string;
    core_message: string;
    key_benefits: string[] | null;
    channels: string[];
  };
  ledger_id?: string;
  download_url: string;
  notion: { success: boolean; page_url?: string; error?: string };
  slack: { success: boolean; error?: string };
}

export default function BriefForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState('');
  const [coreMessage, setCoreMessage] = useState('');
  const [keyBenefits, setKeyBenefits] = useState('');
  const [channels, setChannels] = useState<string[]>(['email', 'social']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateBriefResponse | null>(null);

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

    const benefits = keyBenefits
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create brief');
      }

      setResult(data as CreateBriefResponse);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brief');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Campaign name *
          </label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
            placeholder="Q2 Product Launch"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Objective *
          </label>
          <input
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
            placeholder="Drive 25% signup growth"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Target audience *
          </label>
          <input
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
            placeholder="Growth marketers at SaaS teams"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Core message *
          </label>
          <input
            value={coreMessage}
            onChange={(event) => setCoreMessage(event.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
            placeholder="OS Brief helps teams ship campaigns faster."
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs uppercase tracking-wide text-zinc-500">
          Key benefits (one per line)
        </label>
        <textarea
          value={keyBenefits}
          onChange={(event) => setKeyBenefits(event.target.value)}
          className="mt-2 h-28 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          placeholder="Faster approvals\nClearer alignment\nSingle source of truth"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs uppercase tracking-wide text-zinc-500">Channels</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {CHANNEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                channels.includes(option.value)
                  ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-100'
                  : 'border-zinc-700 bg-zinc-950 text-zinc-400'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={channels.includes(option.value)}
                onChange={() => toggleChannel(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
        >
          {isSubmitting ? 'Creating...' : 'Create brief'}
        </button>
        <span className="text-xs text-zinc-500">
          Briefs will be archived in Notion and posted to Slack if connected.
        </span>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
          <div className="text-zinc-100">
            Brief created: <span className="font-semibold">{result.brief.brief_id}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-400">{result.brief.name}</div>
          <div className="mt-4 grid gap-2 text-xs text-zinc-400">
            <div>
              Notion archive:{' '}
              {result.notion.success ? (
                result.notion.page_url ? (
                  <a
                    className="text-indigo-300 underline"
                    href={result.notion.page_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View page
                  </a>
                ) : (
                  'Created'
                )
              ) : (
                `Failed${result.notion.error ? `: ${result.notion.error}` : ''}`
              )}
            </div>
            <div>
              Slack alert:{' '}
              {result.slack.success
                ? 'Sent to #brief'
                : `Failed${result.slack.error ? `: ${result.slack.error}` : ''}`}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={result.download_url}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-500"
            >
              Download brief
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
