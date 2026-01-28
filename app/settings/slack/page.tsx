import AppShell from '@/components/AppShell';
import SlackSettings from '@/components/SlackSettings';

export default function SlackSettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Slack integration</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Send realtime brief updates to your Slack channel.
          </p>
        </div>
        <SlackSettings />
      </div>
    </AppShell>
  );
}
