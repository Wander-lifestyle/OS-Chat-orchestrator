'use client';

import { OrganizationProfile } from '@clerk/nextjs';

export default function OrganizationSettings() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <OrganizationProfile />
    </div>
  );
}
