'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Menu, Pencil, Plus, SquarePen } from 'lucide-react'
import UserMenu from '@/components/header/user-menu'
import {
  MobileToolbar,
  MobileToolbarAction,
} from '@/components/navigation/mobile-toolbar'
import { cn } from '@/lib/utils'

const isEditorPath = (pathname: string) =>
  pathname === '/write' || pathname.endsWith('/edit')

const hasMobileToolbar = (pathname: string) =>
  pathname === '/dashboard' ||
  pathname.startsWith('/entries/') ||
  isEditorPath(pathname)

const JournalMobileNavigation = ({ pathname }: { pathname: string }) => {
  if (isEditorPath(pathname)) return null

  if (pathname === '/dashboard') {
    return (
      <MobileToolbar label="Journal navigation">
        <MobileToolbarAction
          active
          href="/dashboard"
          icon={BookOpen}
          label="Stash"
        />
        <MobileToolbarAction
          href="/write"
          icon={SquarePen}
          label="Write"
          variant="accent"
        />
        <UserMenu
          trigger={<MobileToolbarAction icon={Menu} label="Menu" />}
        />
      </MobileToolbar>
    )
  }

  if (pathname.startsWith('/entries/')) {
    return (
      <MobileToolbar label="Journal entry actions">
        <MobileToolbarAction href="/dashboard" icon={BookOpen} label="Stash" />
        <MobileToolbarAction href="/write" icon={Plus} label="New" />
        <MobileToolbarAction
          href={`${pathname}/edit`}
          icon={Pencil}
          label="Edit entry"
          variant="accent"
        />
      </MobileToolbar>
    )
  }

  return null
}

const JournalMobileShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() ?? ''

  return (
    <>
      <div className={cn(hasMobileToolbar(pathname) && 'pb-24 lg:pb-0')}>
        {children}
      </div>
      <JournalMobileNavigation pathname={pathname} />
    </>
  )
}

export default JournalMobileShell
