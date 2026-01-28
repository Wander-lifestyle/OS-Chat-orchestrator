'use client';

import { useEffect, useState } from 'react';

interface BillingStatus {
  status: string;
  is_active: boolean;
  trial_end: string | null;
  current_period_end: string | null;
  price_id: string | null;
}

export default function PricingPanel() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    const response = await fetch('/api/billing');
    const data = await response.json();
    if (response.ok) {
      setStatus(data);
    } else {
      setError(data?.error || 'Failed to load billing status');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Checkout failed');
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Portal failed');
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Plan</div>
        <h2 className="mt-2 text-xl font-semibold text-zinc-100">OS Brief Pro</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Unlimited briefs, Notion + Slack automation, audit logs, and priority support.
        </p>
        <div className="mt-4 text-3xl font-semibold text-zinc-100">$49</div>
        <div className="text-xs text-zinc-500">per month, billed monthly</div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:bg-zinc-700"
        >
          {loading ? 'Loading...' : 'Start subscription'}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Billing status</div>
        <div className="mt-2 text-lg font-semibold text-zinc-100">
          {status ? status.status : 'Loading'}
        </div>
        {status?.trial_end && (
          <p className="mt-2 text-sm text-zinc-400">
            Trial ends {new Date(status.trial_end).toLocaleDateString()}
          </p>
        )}
        {status?.current_period_end && (
          <p className="mt-2 text-sm text-zinc-400">
            Renews {new Date(status.current_period_end).toLocaleDateString()}
          </p>
        )}

        <button
          onClick={handlePortal}
          disabled={loading || !status?.is_active}
          className="mt-6 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Manage billing
        </button>

        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
      </div>
    </div>
  );
}
