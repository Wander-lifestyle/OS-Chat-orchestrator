'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CreateOrganization, useOrganization } from '@clerk/nextjs';
import BriefForm from './BriefForm';
import RecentBriefs from './RecentBriefs';

interface UsageSummary {
  count: number;
  limit: number;
  periodStart: string;
  periodEnd: string;
  status?: string;
}

interface IntegrationStatus {
  connected: boolean;
  workspace_id?: string | null;
  database_id?: string | null;
  channel_id?: string | null;
}

function StatusCard({
  label,
  connected,
  description,
  href,
}: {
  label: string;
  connected: boolean;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-100">{label}</div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            connected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-zinc-700/40 text-zinc-300'
          }`}
        >
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
      <div className="mt-2 text-xs text-zinc-400">{description}</div>
    </Link>
  );
}

export default function BriefDashboard() {
  const { organization, isLoaded } = useOrganization();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [notion, setNotion] = useState<IntegrationStatus | null>(null);
  const [slack, setSlack] = useState<IntegrationStatus | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!organization?.id) return;
    const load = async () => {
      try {
        const [usageRes, notionRes, slackRes] = await Promise.all([
          fetch('/api/usage'),
          fetch('/api/integrations/notion'),
          fetch('/api/integrations/slack'),
        ]);

        if (usageRes.ok) {
          setUsage(await usageRes.json());
        }
        if (notionRes.ok) {
          setNotion(await notionRes.json());
        }
        if (slackRes.ok) {
          setSlack(await slackRes.json());
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    };
    load();
  }, [organization?.id, refreshKey]);

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <p className="text-sm text-zinc-400">Loading workspace...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="grid gap-6">
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6">
          <h1 className="text-xl font-semibold text-zinc-100">Create an organization</h1>
          <p className="mt-2 text-sm text-zinc-400">
            OS Brief uses organizations to manage briefs, integrations, and billing.
            Create your first workspace to continue.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <CreateOrganization />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Create a brief</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Draft a structured campaign brief, then export it, archive in Notion, and alert Slack.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs uppercase tracking-wide text-zinc-500">Usage</div>
          <div className="mt-2 text-lg font-semibold text-zinc-100">
            {usage ? `${usage.count} / ${usage.limit}` : '--'}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {usage ? `Period: ${usage.periodStart} → ${usage.periodEnd}` : 'Loading usage'}
          </div>
          {usage?.status && (
            <div className="mt-2 text-xs text-zinc-500">{usage.status}</div>
          )}
        </div>
        <StatusCard
          label="Notion"
          connected={Boolean(notion?.connected)}
          description={
            notion?.connected
              ? `Workspace ${notion?.workspace_id || 'connected'}`
              : 'Connect a workspace to archive briefs.'
          }
          href="/settings/notion"
        />
        <StatusCard
          label="Slack"
          connected={Boolean(slack?.connected)}
          description={
            slack?.connected
              ? `Channel ${slack?.channel_id || 'connected'}`
              : 'Connect Slack to notify #brief.'
          }
          href="/settings/slack"
        />
      </div>

      <BriefForm onCreated={() => setRefreshKey((value) => value + 1)} />

      <RecentBriefs refreshKey={refreshKey} />
    </div>
  );
}
