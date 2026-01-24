import './globals.css';

export const metadata = {
  title: 'Editorial OS',
  description: 'AI-powered content operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-gray-900 antialiased">{children}</body>
    </html>
  );
}
