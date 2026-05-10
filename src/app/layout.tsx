import type { Metadata } from 'next'
import UserMenu from '@/components/header/user-menu'
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
        <UserMenu />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
