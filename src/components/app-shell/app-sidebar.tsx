'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, SquarePen } from 'lucide-react'
import ThemeToggle from '@/components/app-shell/theme-toggle'
import UserMenu, {
  LoginMenu,
  UserMenuSkeleton,
} from '@/components/app-shell/user-menu'
import { Skeleton } from '@/components/ui/skeleton'
import type { AuthProfile } from '@/lib/atoms/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

type AppSidebarProps = {
  isLoading: boolean
  isLoggedIn: boolean
  profile: AuthProfile | null
}

const navigationItems = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
    isActive: (pathname: string) => pathname === '/',
  },
  {
    href: '/dashboard',
    icon: BookOpen,
    label: 'Stash',
    isActive: (pathname: string) =>
      pathname === '/dashboard' ||
      (pathname.startsWith('/entries/') && !pathname.endsWith('/edit')),
  },
  {
    href: '/write',
    icon: SquarePen,
    label: 'Write',
    isActive: (pathname: string) =>
      pathname === '/write' || pathname.endsWith('/edit'),
  },
]

const AppSidebar = ({ isLoading, isLoggedIn, profile }: AppSidebarProps) => {
  const pathname = usePathname() ?? ''
  const { isMobile, setOpenMobile } = useSidebar()

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="hidden p-1 md:flex">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-10 w-full items-center gap-2 overflow-hidden rounded-md">
              <span className="border-sidebar-border bg-background flex size-10 shrink-0 items-center justify-center rounded-xl border">
                <Image
                  src="/daystash-leaf.svg"
                  alt=""
                  width={14}
                  height={24}
                  className="h-7 w-auto object-contain"
                  aria-hidden="true"
                />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-serif text-2xl font-bold">
                  Daystash
                </span>
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-16 md:pt-0">
        <SidebarGroup className="p-4 md:p-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 md:gap-1">
              {isLoading
                ? navigationItems.map(({ href }) => (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuSkeleton
                        showIcon
                        className="h-12 rounded-xl px-3 md:h-8 md:rounded-md md:px-2 [&_[data-sidebar=menu-skeleton-icon]]:size-5 md:[&_[data-sidebar=menu-skeleton-icon]]:size-4 group-data-[collapsible=icon]:[&_[data-sidebar=menu-skeleton-text]]:hidden"
                      />
                    </SidebarMenuItem>
                  ))
                : navigationItems.map(
                    ({ href, icon: Icon, label, isActive }) => (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                          tooltip={label}
                          isActive={isActive(pathname)}
                          className="hover:bg-muted active:bg-muted data-[active=true]:bg-muted h-12 rounded-xl px-3 text-base md:h-8 md:rounded-md md:px-2 md:text-sm [&>svg]:size-5 md:[&>svg]:size-4"
                          asChild
                        >
                          <Link href={href} onClick={closeMobileSidebar}>
                            <Icon />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-4 md:gap-2 md:p-2">
        {isLoading ? (
          <div
            aria-label="Loading appearance"
            className="flex min-h-12 items-center justify-between rounded-xl px-3 group-data-[collapsible=icon]:hidden md:min-h-0 md:rounded-md md:px-2 md:py-1"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ) : (
          <div className="flex min-h-12 items-center justify-between rounded-xl px-3 group-data-[collapsible=icon]:hidden md:min-h-0 md:rounded-md md:px-2 md:py-1">
            <span className="text-base font-medium md:text-sm">Appearance</span>
            <ThemeToggle size={isMobile ? 'default' : 'sm'} />
          </div>
        )}
        {isLoading ? (
          <UserMenuSkeleton />
        ) : isLoggedIn ? (
          <UserMenu profile={profile} />
        ) : (
          <LoginMenu />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
