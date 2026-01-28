'use client';

import { useEffect, useState } from 'react';

interface NotionStatus {
  connected: boolean;
  workspace_id: string | null;
  database_id: string | null;
}

export default function NotionSettings() {
  const [status, setStatus] = useState<NotionStatus | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/integrations/notion');
      if (response.ok) {
        const data = (await response.json()) as NotionStatus;
        setStatus(data);
        setDatabaseId(data.database_id || '');
        setWorkspaceId(data.workspace_id || '');
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/integrations/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          database_id: databaseId,
          workspace_id: workspaceId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save Notion settings');
      }
      setMessage('Notion connection saved.');
      setAccessToken('');
      setStatus({ connected: true, workspace_id: workspaceId, database_id: databaseId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Notion settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/integrations/notion/test', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Notion test failed');
      }
      setMessage(`Notion test success: ${data?.database || 'Connected'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notion test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Connect Notion</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            status?.connected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-zinc-700/40 text-zinc-300'
          }`}
        >
          {status?.connected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        Use a Notion integration token with access to your brief archive database.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Integration token
          </label>
          <input
            value={accessToken}
            onChange={(event) => setAccessToken(event.target.value)}
            placeholder="secret_..."
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Database ID
          </label>
          <input
            value={databaseId}
            onChange={(event) => setDatabaseId(event.target.value)}
            placeholder="Notion database ID"
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Workspace ID (optional)
          </label>
          <input
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
            placeholder="Workspace ID"
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
          {saving ? 'Saving...' : 'Save Notion settings'}
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
