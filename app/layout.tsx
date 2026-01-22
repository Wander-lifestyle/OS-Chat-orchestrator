import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Light DAM',
  description: 'Lightweight digital asset manager powered by Cloudinary.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-os-bg text-os-text">
        {children}
      </body>
    </html>
  )
}
