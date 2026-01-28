'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

const navItems = [
  { label: 'Briefs', href: '/' },
  { label: 'Org', href: '/organization' },
  { label: 'Integrations', href: '/settings' },
  { label: 'Usage', href: '/usage' },
  { label: 'Audit', href: '/audit' },
  { label: 'Billing', href: '/pricing' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold">
              OS Brief
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm ${
                      isActive ? 'text-zinc-100' : 'text-zinc-400'
                    } hover:text-zinc-100`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              appearance={{
                elements: {
                  rootBox: 'hidden md:block',
                  organizationSwitcherTrigger:
                    'border border-zinc-800 bg-zinc-900 text-zinc-100',
                },
              }}
            />
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: 'h-9 w-9',
                },
              }}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
