'use client'

import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useRefreshAuthUser } from '@/hooks/use-auth-user'

type UserMenuProps = {
  user: User
}

const getUserName = (user: User) => {
  const fullName = user.user_metadata.full_name

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim()
  }

  return user.email?.split('@')[0] || 'Account'
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

const UserMenu = ({ user }: UserMenuProps) => {
  const refreshAuthUser = useRefreshAuthUser()
  const router = useRouter()
  const name = getUserName(user)
  const initials = getInitials(name)

  const handleLogout = async () => {
    const result = await logout()
    if (result?.error) return

    await refreshAuthUser()
    router.replace('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Open user menu"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-14 rounded-xl px-3 md:h-12 md:rounded-md md:px-2 [&>svg]:size-5 md:[&>svg]:size-4"
            >
              <Avatar className="size-10 rounded-lg md:size-8">
                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 text-left text-base leading-tight md:text-sm">
                <span className="truncate font-medium">{name}</span>
                {user.email && (
                  <span className="text-muted-foreground truncate text-sm md:text-xs">
                    {user.email}
                  </span>
                )}
              </span>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="min-w-40">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => void handleLogout()}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default UserMenu
