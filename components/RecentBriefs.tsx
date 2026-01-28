'use client';

import { useEffect, useState } from 'react';

interface BriefItem {
  brief_id: string;
  brief_uuid: string;
  name: string;
  created_at: string;
  download_url: string;
  ledger_id?: string | null;
}

export default function RecentBriefs({ refreshKey }: { refreshKey: number }) {
  const [briefs, setBriefs] = useState<BriefItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/briefs');
        if (response.ok) {
          const data = await response.json();
          setBriefs(data.briefs || []);
        }
      } catch (error) {
        console.error('Failed to load briefs', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Recent briefs</h2>
        <span className="text-xs text-zinc-500">{briefs.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {loading && <div className="text-sm text-zinc-500">Loading briefs...</div>}
        {!loading && briefs.length === 0 && (
          <div className="text-sm text-zinc-500">No briefs created yet.</div>
        )}
        {briefs.map((brief) => (
          <div
            key={brief.brief_uuid}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-zinc-100">{brief.name}</div>
                <div className="text-xs text-zinc-500">
                  {(brief.brief_id || brief.brief_uuid) ?? 'Brief'} •{' '}
                  {new Date(brief.created_at).toLocaleString()}
                </div>
              </div>
              <a
                href={brief.download_url}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200 hover:border-zinc-500"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
