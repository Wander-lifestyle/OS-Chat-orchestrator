'use client';

import { useEffect, useState } from 'react';

interface UsageSummary {
  count: number;
  limit: number;
  periodStart: string;
  periodEnd: string;
  status?: string;
}

export default function UsagePanel() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/usage');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load usage');
        }
        setUsage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load usage');
      }
    };
    load();
  }, []);

  if (error) {
    return <div className="text-sm text-red-400">{error}</div>;
  }

  if (!usage) {
    return <div className="text-sm text-zinc-500">Loading usage...</div>;
  }

  const remaining = Math.max(usage.limit - usage.count, 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="text-xs uppercase tracking-wide text-zinc-500">Monthly usage</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-100">
        {usage.count} / {usage.limit}
      </div>
      <div className="mt-2 text-sm text-zinc-400">
        {remaining} briefs remaining for {usage.periodStart} → {usage.periodEnd}
      </div>
      {usage.status && (
        <div className="mt-3 text-xs text-zinc-500">Plan status: {usage.status}</div>
      )}
    </div>
  );
}
