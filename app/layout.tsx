import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'OS Brief',
  description: 'Collaborative brief creation with Notion + Slack automation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="grain antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
