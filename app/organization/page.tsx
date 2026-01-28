import AppShell from '@/components/AppShell';
import OrganizationSettings from '@/components/OrganizationSettings';

export default function OrganizationPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Organization</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage members, roles, and invites for your workspace.
          </p>
        </div>
        <OrganizationSettings />
      </div>
    </AppShell>
  );
}
