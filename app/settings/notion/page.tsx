import AppShell from '@/components/AppShell';
import NotionSettings from '@/components/NotionSettings';

export default function NotionSettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Notion integration</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Store every brief in your Notion archive.
          </p>
        </div>
        <NotionSettings />
      </div>
    </AppShell>
  );
}
