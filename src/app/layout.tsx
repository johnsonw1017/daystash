import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import HeaderControls from '@/components/header/header-controls'
import Logo from '@/components/header/logo'
import Providers from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { cn } from '@/lib/utils'
import { cormorant, inter } from '@/lib/fonts'
import { isTheme, THEME_COOKIE_NAME } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Daystash',
  description: 'Stash your important moments in one place.',
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value
  const initialTheme = isTheme(themeCookie) ? themeCookie : 'light'
  const themeScript = `
    (() => {
      const themeName = '${THEME_COOKIE_NAME}';
      const storedTheme = window.localStorage.getItem(themeName);
      const cookieTheme = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith(themeName + '='))
        ?.split('=')[1];
      const theme = storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : cookieTheme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
    })();
  `

  return (
    <html
      lang="en"
      className={cn(
        inter.variable,
        cormorant.variable,
        initialTheme === 'dark' && 'dark'
      )}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
