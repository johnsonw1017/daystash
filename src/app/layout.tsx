import type { Metadata, Viewport } from 'next'
import HeaderControls from '@/components/header/header-controls'
import Logo from '@/components/header/logo'
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

const legacyThemeStorageScript = `
  (() => {
    const themeName = 'theme';
    try {
      const storedTheme = window.localStorage.getItem(themeName);
      if (storedTheme !== '"dark"' && storedTheme !== '"light"') {
        return;
      }

      window.localStorage.setItem(themeName, JSON.parse(storedTheme));
    } catch {}
  })();
`

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
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: legacyThemeStorageScript }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>
          <header className="sticky top-0 z-50 h-16">
            <div className="bg-background flex h-full items-center justify-between px-3">
              <Logo />
              <HeaderControls />
            </div>
          </header>
          <main>{children}</main>
          <Toaster />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
