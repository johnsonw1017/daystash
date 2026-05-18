import type { Metadata } from 'next'
import Logo from '@/components/header/logo'
import UserMenu from '@/components/header/user-menu'
import Providers from '@/components/providers'
import './globals.css'
import { cn } from '@/lib/utils'
import { cormorant, inter } from '@/lib/fonts'
import { createServerSideClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Daystash',
  description: 'Stash your important moments in one place.',
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const firstName = fullName.trim().split(' ').filter(Boolean)[0]

  return (
    <html lang="en" className={cn(inter.variable, cormorant.variable)}>
      <body className="font-sans">
        <Providers>
          <header className="sticky top-0 z-50 h-16">
            <div className="flex h-full items-center justify-between px-3">
              <Logo />
              <UserMenu isLoggedIn={Boolean(user)} firstName={firstName} />
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
