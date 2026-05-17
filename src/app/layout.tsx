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
          <Logo />
          <UserMenu isLoggedIn={Boolean(user)} firstName={firstName} />
          {children}
        </Providers>
      </body>
    </html>
  )
}

export default RootLayout
