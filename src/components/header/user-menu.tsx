'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSupabaseUser } from '@/hooks/use-supabase-user'
import supabase from '@/lib/supabase/client'

const UserMenu = () => {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useSupabaseUser()
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const firstName = fullName.trim().split(' ').filter(Boolean)[0]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return null
  }

  if (!isLoggedIn) {
    return (
      <Button asChild size="sm">
        <Link href="/login">Login</Link>
      </Button>
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
            <Link href="/dashboard" className="w-full">
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="w-full">
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default UserMenu
