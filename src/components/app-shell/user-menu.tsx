'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, LogIn, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useRefreshAuth } from '@/hooks/use-auth'
import type { AuthProfile } from '@/lib/atoms/auth'
import { getLoginHref } from '@/lib/auth/redirect'

type UserMenuProps = {
  profile: AuthProfile | null
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export const UserMenu = ({ profile }: UserMenuProps) => {
  const refreshAuth = useRefreshAuth()
  const router = useRouter()
  const name = profile?.full_name.trim() || 'Account'
  const initials = getInitials(name)

  const handleLogout = async () => {
    const result = await logout()
    if (result?.error) return

    await refreshAuth()
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
              className="hover:bg-muted active:bg-muted data-[state=open]:bg-muted h-14 rounded-xl px-3 md:h-12 md:rounded-md md:px-2 [&>svg]:size-5 md:[&>svg]:size-4"
            >
              <Avatar className="size-10 rounded-lg md:size-8">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt="" />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 text-left text-base leading-tight md:text-sm">
                <span className="truncate font-medium">{name}</span>
                {profile?.email && (
                  <span className="text-muted-foreground truncate text-sm md:text-xs">
                    {profile.email}
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

export const LoginMenu = () => {
  const pathname = usePathname() ?? '/'
  const loginHref = getLoginHref(pathname)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip="Login"
          className="hover:bg-muted active:bg-muted h-14 rounded-xl px-3 md:h-12 md:rounded-md md:px-2 [&>svg]:size-5 md:[&>svg]:size-4"
          asChild
        >
          <Link href={loginHref}>
            <LogIn />
            <span className="text-base font-medium md:text-sm">Login</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export const UserMenuSkeleton = () => (
  <SidebarMenu aria-label="Loading account">
    <SidebarMenuItem>
      <div className="flex h-14 items-center gap-2 rounded-xl px-3 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 md:h-12 md:rounded-md md:px-2">
        <Skeleton className="size-10 shrink-0 rounded-lg md:size-8" />
        <span className="grid min-w-0 flex-1 gap-1 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36 max-w-full" />
        </span>
        <Skeleton className="size-4 group-data-[collapsible=icon]:hidden" />
      </div>
    </SidebarMenuItem>
  </SidebarMenu>
)

export default UserMenu
