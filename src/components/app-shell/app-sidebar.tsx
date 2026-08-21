'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { BookOpen, Home, SquarePen } from 'lucide-react'
import ThemeToggle from '@/components/app-shell/theme-toggle'
import UserMenu from '@/components/app-shell/user-menu'
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
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

type AppSidebarProps = {
  user: User
}

const navigationItems = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
    isActive: (pathname: string) => pathname === '/',
  },
  {
    href: '/write',
    icon: SquarePen,
    label: 'Write',
    isActive: (pathname: string) =>
      pathname === '/write' || pathname.endsWith('/edit'),
  },
  {
    href: '/dashboard',
    icon: BookOpen,
    label: 'Stash',
    isActive: (pathname: string) =>
      pathname === '/dashboard' ||
      (pathname.startsWith('/entries/') && !pathname.endsWith('/edit')),
  },
]

const AppSidebar = ({ user }: AppSidebarProps) => {
  const pathname = usePathname() ?? ''
  const { isMobile, setOpenMobile } = useSidebar()

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="hidden md:flex">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-14 w-full items-center gap-2 overflow-hidden rounded-md p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
              <span className="border-sidebar-border bg-background flex aspect-square size-10 shrink-0 items-center justify-center rounded-xl border group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
                <Image
                  src="/daystash-leaf.svg"
                  alt=""
                  width={14}
                  height={24}
                  className="h-7 w-auto object-contain group-data-[collapsible=icon]:h-6"
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
              {navigationItems.map(({ href, icon: Icon, label, isActive }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    tooltip={label}
                    isActive={isActive(pathname)}
                    className="h-12 rounded-xl px-3 text-base md:h-8 md:rounded-md md:px-2 md:text-sm [&>svg]:size-5 md:[&>svg]:size-4"
                    asChild
                  >
                    <Link href={href} onClick={closeMobileSidebar}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-4 md:gap-2 md:p-2">
        <div className="flex min-h-12 items-center justify-between rounded-xl px-3 group-data-[collapsible=icon]:hidden md:min-h-0 md:rounded-md md:px-2 md:py-1">
          <span className="text-base font-medium md:text-sm">Appearance</span>
          <ThemeToggle size={isMobile ? 'default' : 'sm'} />
        </div>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
