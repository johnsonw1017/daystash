'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AppSidebar from '@/components/app-shell/app-sidebar'
import Logo from '@/components/app-shell/logo'
import { Button } from '@/components/ui/button'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { getLoginHref } from '@/lib/auth/redirect'

type AppShellProps = {
  children: ReactNode
}

type MobileHeaderProps = {
  isLoading: boolean
  isLoggedIn: boolean
  pathname: string
}

const MobileHeader = ({
  isLoading,
  isLoggedIn,
  pathname,
}: MobileHeaderProps) => {
  const loginHref = getLoginHref(pathname)

  return (
    <header className="bg-background/95 sticky top-0 z-60 h-16 border-b backdrop-blur md:hidden">
      <div className="flex h-full items-center justify-between px-3">
        <Logo />
        {isLoading ? (
          <Skeleton aria-label="Loading user" className="size-11 rounded-md" />
        ) : isLoggedIn ? (
          <SidebarTrigger className="size-11" />
        ) : (
          pathname !== '/login' && (
            <Button asChild size="sm">
              <Link href={loginHref}>Login</Link>
            </Button>
          )
        )}
      </div>
    </header>
  )
}

const AppShell = ({ children }: AppShellProps) => {
  const auth = useAuth()
  const pathname = usePathname() ?? ''

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        isLoading={auth.isLoading}
        isLoggedIn={auth.isLoggedIn}
        profile={auth.profile}
      />
      <SidebarInset>
        <MobileHeader
          isLoading={auth.isLoading}
          isLoggedIn={auth.isLoggedIn}
          pathname={pathname}
        />
        <div className="sticky top-0 z-40 hidden h-0 md:block">
          <SidebarTrigger className="bg-background/90 absolute top-1 left-1 size-10 rounded-xl border shadow-sm backdrop-blur" />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppShell
