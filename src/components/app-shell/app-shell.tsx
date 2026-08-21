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
import { useAuthUser } from '@/hooks/use-auth-user'

type AppShellProps = {
  children: ReactNode
}

type PublicShellProps = AppShellProps & {
  isLoading: boolean
  pathname: string
}

const PublicShell = ({ children, isLoading, pathname }: PublicShellProps) => {
  const loginHref = `/login?redirectTo=${encodeURIComponent(pathname || '/')}`

  return (
    <>
      <header className="sticky top-0 z-50 h-16">
        <div className="bg-background flex h-full items-center justify-between px-3">
          <Logo />
          {isLoading ? (
            <Skeleton aria-label="Loading user" className="h-8 w-16" />
          ) : (
            pathname !== '/login' && (
              <Button asChild size="sm">
                <Link href={loginHref}>Login</Link>
              </Button>
            )
          )}
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}

const AppShell = ({ children }: AppShellProps) => {
  const authUser = useAuthUser()
  const pathname = usePathname() ?? ''

  if (authUser.isLoading || !authUser.user) {
    return (
      <PublicShell isLoading={authUser.isLoading} pathname={pathname}>
        {children}
      </PublicShell>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar user={authUser.user} />
      <SidebarInset>
        <header className="bg-background/95 sticky top-0 z-60 h-16 border-b backdrop-blur md:hidden">
          <div className="flex h-full items-center justify-between px-3">
            <Logo />
            <SidebarTrigger className="size-11" />
          </div>
        </header>
        <div className="sticky top-0 z-40 hidden h-0 md:block">
          <SidebarTrigger className="bg-background/90 absolute top-3 left-3 size-9 border shadow-sm backdrop-blur" />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppShell
