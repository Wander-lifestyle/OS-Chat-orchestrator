import AppShell from '@/components/AppShell';
import UsagePanel from '@/components/UsagePanel';

export default function UsagePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Usage</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Track brief creation limits for your organization.
          </p>
        </div>
        <UsagePanel />
      </div>
    </AppShell>
  );
}
