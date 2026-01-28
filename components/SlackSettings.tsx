'use client';

import { useEffect, useState } from 'react';

interface SlackStatus {
  connected: boolean;
  channel_id: string | null;
  team_id: string | null;
}

export default function SlackSettings() {
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/integrations/slack');
      if (response.ok) {
        const data = (await response.json()) as SlackStatus;
        setStatus(data);
        setChannelId(data.channel_id || '');
        setTeamId(data.team_id || '');
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          channel_id: channelId,
          team_id: teamId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save Slack settings');
      }
      setMessage('Slack connection saved.');
      setAccessToken('');
      setStatus({ connected: true, channel_id: channelId, team_id: teamId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Slack settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/integrations/slack/test', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Slack test failed');
      }
      setMessage('Slack test message sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Slack test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Connect Slack</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            status?.connected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-zinc-700/40 text-zinc-300'
          }`}
        >
          {status?.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        Provide a bot token and the channel ID for #brief.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">Bot token</label>
          <input
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="xoxb-..."
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">Channel ID</label>
          <input
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            placeholder="C0123456789"
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Team ID (optional)
          </label>
          <input
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            placeholder="T0123456789"
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
      </div>

      {message && <div className="mt-4 text-sm text-emerald-300">{message}</div>}
      {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:bg-zinc-700"
        >
          {saving ? 'Saving...' : 'Save Slack settings'}
        </button>
        <button
          onClick={handleTest}
          disabled={testing || !status?.connected}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {testing ? 'Testing...' : 'Run test'}
        </button>
      </div>
    </div>
  );
}
