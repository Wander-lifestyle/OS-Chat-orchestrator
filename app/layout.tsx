import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Light Brief',
  description: 'Minimal brief capture with Slack notification and PDF export.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
