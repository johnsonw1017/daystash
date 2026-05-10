'use client'

import Link from 'next/link'

import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import { logout } from '@/actions/auth'
import { usePathname } from 'next/navigation'

const UserMenu = () => {
  const { user, isLoggedIn, isLoading, setUser } = useSupabaseUser()
  const pathname = usePathname()

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const firstName = fullName.trim().split(' ').filter(Boolean)[0]

  const handleLogout = async () => {
    setUser(null)
    await logout()
  }

  if (isLoading || pathname === '/login') {
    return null
  }

  if (!isLoggedIn) {
    return (
      <div className="absolute top-2 right-2 z-50">
        <Button asChild size="sm">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="absolute top-2 right-2 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" aria-label="Open user menu">
            <User className="size-5" />
            <span>{firstName || 'Account'}</span>
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
          <DropdownMenuItem asChild>
            <Link href="/settings" className="w-full">
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default UserMenu
