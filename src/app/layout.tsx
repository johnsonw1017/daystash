import type { Metadata } from 'next'
import UserMenu from '@/components/header/user-menu'
import Providers from '@/components/providers'
import './globals.css'

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
    <html lang="en">
      <body>
        <Providers>
          <UserMenu />
          {children}
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
