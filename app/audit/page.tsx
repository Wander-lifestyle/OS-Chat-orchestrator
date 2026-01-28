import AppShell from '@/components/AppShell';
import AuditLogTable from '@/components/AuditLogTable';

export default function AuditPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Audit logs</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Review every brief creation, integration update, and automation event.
          </p>
        </div>
        <AuditLogTable />
      </div>
    </AppShell>
  );
}
