import type { Metadata } from 'next'
import UserMenu from '@/components/header/user-menu'
import Providers from '@/components/providers'
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
      <body className="font-sans">
        <Providers>
          <UserMenu />
          {children}
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
