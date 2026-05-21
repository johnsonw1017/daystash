import type { Metadata } from 'next'
import Logo from '@/components/header/logo'
import HeaderAuth from '@/components/header/header-auth'
import Providers from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { cn } from '@/lib/utils'
import { cormorant, inter } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Daystash',
  description: 'Stash your important moments in one place.',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="en" className={cn(inter.variable, cormorant.variable)}>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>
          <header className="sticky top-0 z-50 h-16">
            <div className="flex h-full items-center justify-between px-3">
              <Logo />
              <HeaderAuth />
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
