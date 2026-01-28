import Link from 'next/link';
import AppShell from '@/components/AppShell';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Connect integrations and manage how briefs are archived.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/settings/notion"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
          >
            <h2 className="text-lg font-semibold text-zinc-100">Notion</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Connect a Notion database for brief archiving.
            </p>
          </Link>
          <Link
            href="/settings/slack"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
          >
            <h2 className="text-lg font-semibold text-zinc-100">Slack</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Send realtime updates to your #brief channel.
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
