'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/actions/auth'
import { useAuthUser, useRefreshAuthUser } from '@/hooks/use-auth-user'
import { useProfile } from '@/hooks/use-profile'

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
    return null
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
        <Button size="sm" aria-label="Open user menu">
          <User className="size-5" />
          <span>{profile?.full_name || 'Account'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/" className="w-full">
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="w-full">
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
