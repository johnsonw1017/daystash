import type { Metadata, Viewport } from 'next'
import AppShell from '@/components/app-shell/app-shell'
import Providers from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { cn } from '@/lib/utils'
import { cormorant, inter } from '@/lib/fonts'
import ServiceWorkerRegistration from '@/components/pwa/service-worker-registration'

export const metadata: Metadata = {
  title: 'Daystash',
  description: 'Stash your important moments in one place.',
  applicationName: 'Daystash',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daystash',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/daystash-icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#134b34' },
    { media: '(prefers-color-scheme: dark)', color: '#061009' },
  ],
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html
      lang="en"
      className={cn(inter.variable, cormorant.variable)}
      suppressHydrationWarning
    >
      <body className="font-sans" suppressHydrationWarning>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
