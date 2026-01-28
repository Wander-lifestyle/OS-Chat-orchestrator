import AppShell from '@/components/AppShell';
import PricingPanel from '@/components/PricingPanel';

export default function PricingPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Billing</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Upgrade to unlock higher usage limits and continuous automation.
          </p>
        </div>
        <PricingPanel />
      </div>
    </AppShell>
  );
}
