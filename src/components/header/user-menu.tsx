'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import ThemeToggle from '@/components/header/theme-toggle'
import { logout } from '@/actions/auth'
import { useAuthUser, useRefreshAuthUser } from '@/hooks/use-auth-user'
import { useProfile } from '@/hooks/use-profile'
import { Suspense } from 'react'

const UserMenuSkeleton = () => (
  <div className="flex size-8 items-center justify-center rounded-md border border-transparent">
    <Skeleton className="size-5 rounded-sm" />
  </div>
)

const UserMenu = () => {
  const authUser = useAuthUser()
  const { data: profile } = useProfile()
  const refreshAuthUser = useRefreshAuthUser()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const redirectTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const loginHref = `/login?redirectTo=${encodeURIComponent(redirectTo)}`

  const handleLogout = async () => {
    const result = await logout()
    if (result?.error) {
      return
    }

    await refreshAuthUser()
    router.replace('/login')
  }

  if (pathname === '/login') {
    return null
  }

  if (authUser.isLoading) {
    return <UserMenuSkeleton />
  }

  if (!authUser.isLoggedIn) {
    return (
      <Button asChild size="sm">
        <Link href={loginHref}>Login</Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" aria-label="Open user menu">
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="max-w-52 truncate">
          Welcome, {profile?.full_name || 'there'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/" className="w-full">
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/write" className="w-full">
            Write
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="w-full">
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const UserMenuWrapper = () => {
  return (
    <Suspense fallback={<UserMenuSkeleton />}>
      <UserMenu />
    </Suspense>
  )
}

export default UserMenuWrapper
