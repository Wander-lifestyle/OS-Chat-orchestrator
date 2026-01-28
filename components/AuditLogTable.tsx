'use client';

import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  user_id: string;
}

export default function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/audit');
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error('Failed to load audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">Audit log</h2>
      <div className="mt-4 space-y-3 text-sm">
        {loading && <div className="text-zinc-500">Loading logs...</div>}
        {!loading && logs.length === 0 && (
          <div className="text-zinc-500">No audit events yet.</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-zinc-100">{log.action}</div>
              <div className="text-xs text-zinc-500">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
            <div className="mt-1 text-xs text-zinc-500">User: {log.user_id}</div>
            {log.details && (
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-900/60 p-2 text-xs text-zinc-300">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
