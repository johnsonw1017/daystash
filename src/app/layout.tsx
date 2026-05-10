import type { Metadata } from 'next'
import UserMenu from '@/components/user-menu'
import './globals.css'

export const metadata: Metadata = {
  title: 'Daystash',
  description: 'Stash your important moments in one place.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-svh bg-background text-foreground">
        <header className="pointer-events-none absolute top-3 right-4 z-50 bg-transparent md:top-4 md:right-6">
          <div className="pointer-events-auto">
            <UserMenu />
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
