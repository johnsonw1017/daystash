'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Pencil, Search, SquarePen } from 'lucide-react'
import MobileCalendarAction from '@/components/navigation/mobile-calendar-action'
import {
  MobileToolbar,
  MobileToolbarAction,
} from '@/components/navigation/mobile-toolbar'
import { cn } from '@/lib/utils'

const isEditorPath = (pathname: string) =>
  pathname === '/write' || pathname.endsWith('/edit')

const hasMobileToolbar = (pathname: string) =>
  pathname === '/dashboard' ||
  pathname === '/search' ||
  pathname.startsWith('/entries/') ||
  isEditorPath(pathname)

const JournalMobileNavigation = ({ pathname }: { pathname: string }) => {
  if (isEditorPath(pathname)) return null

  if (pathname === '/dashboard') {
    return (
      <MobileToolbar label="Journal navigation">
        <MobileCalendarAction />
        <MobileToolbarAction href="/search" icon={Search} label="Search" />
        <MobileToolbarAction
          className="w-full justify-self-center"
          href="/write"
          icon={SquarePen}
          label="Write"
          variant="accent"
        />
      </MobileToolbar>
    )
  }

  if (pathname === '/search') {
    return (
      <MobileToolbar label="Search navigation">
        <MobileToolbarAction href="/dashboard" icon={BookOpen} label="Stash" />
        <MobileToolbarAction
          active
          href="/search"
          icon={Search}
          label="Search"
        />
        <MobileToolbarAction
          href="/write"
          icon={SquarePen}
          label="Write"
          variant="accent"
        />
      </MobileToolbar>
    )
  }

  if (pathname.startsWith('/entries/')) {
    return (
      <MobileToolbar label="Journal entry actions">
        <MobileToolbarAction href="/dashboard" icon={BookOpen} label="Stash" />
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
