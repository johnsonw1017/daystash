'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  forwardRef,
  Suspense,
  type ComponentProps,
  type ReactNode,
} from 'react'

import { BookOpen, Home, LogOut, Menu, SquarePen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import ThemeToggle from '@/components/header/theme-toggle'
import { logout } from '@/actions/auth'
import { useAuthUser, useRefreshAuthUser } from '@/hooks/use-auth-user'
import { cn } from '@/lib/utils'

const UserMenuSkeleton = () => (
  <div className="flex size-8 items-center justify-center rounded-md border border-transparent">
    <Skeleton className="size-5 rounded-sm" />
  </div>
)

type UserMenuProps = {
  mobileClassName?: string
  trigger?: ReactNode
}

const navigationItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/write', icon: SquarePen, label: 'Write' },
  { href: '/dashboard', icon: BookOpen, label: 'Stash' },
]

const DefaultMenuTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button>
>(function DefaultMenuTrigger(props, ref) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon-sm"
      className="size-11 shadow-none lg:size-8"
      aria-label="Open user menu"
      {...props}
    >
      <Menu className="size-6 lg:size-5" />
    </Button>
  )
})

type UserMenuDrawerProps = {
  className: string
  direction: 'bottom' | 'right'
  onLogout: () => void
  trigger: ReactNode
}

const UserMenuDrawer = ({
  className,
  direction,
  onLogout,
  trigger,
}: UserMenuDrawerProps) => (
  <div className={className}>
    <Drawer direction={direction}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent
        style={
          direction === 'bottom'
            ? { paddingBottom: 'env(safe-area-inset-bottom)' }
            : undefined
        }
      >
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hidden lg:inline-flex"
              aria-label="Close menu"
            >
              <X />
            </Button>
          </DrawerClose>
          <DrawerHeader className="text-left">
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerDescription>
              Navigate Daystash and manage your preferences.
            </DrawerDescription>
          </DrawerHeader>
          <nav aria-label="User navigation" className="grid gap-2 px-4">
            {navigationItems.map(({ href, icon: Icon, label }) => (
              <DrawerClose key={href} asChild>
                <Button
                  variant="outline"
                  className="h-14 justify-start px-4"
                  asChild
                >
                  <Link href={href}>
                    <Icon className="size-5" />
                    {label}
                  </Link>
                </Button>
              </DrawerClose>
            ))}
          </nav>
          <div className="px-4 pt-2">
            <div className="flex h-14 items-center justify-between rounded-md border px-4">
              <span className="text-sm font-medium">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-12"
                onClick={onLogout}
              >
                <LogOut className="size-5" />
                Logout
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  </div>
)

const UserMenu = ({ mobileClassName, trigger }: UserMenuProps) => {
  const authUser = useAuthUser()
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
    return trigger ?? <UserMenuSkeleton />
  }

  if (!authUser.isLoggedIn) {
    return (
      <Button asChild size="sm">
        <Link href={loginHref}>Login</Link>
      </Button>
    )
  }

  return (
    <>
      <UserMenuDrawer
        className={cn('lg:hidden', mobileClassName)}
        direction="bottom"
        onLogout={handleLogout}
        trigger={trigger ?? <DefaultMenuTrigger />}
      />
      <UserMenuDrawer
        className="hidden lg:block"
        direction="right"
        onLogout={handleLogout}
        trigger={trigger ?? <DefaultMenuTrigger />}
      />
    </>
  )
}

const UserMenuWrapper = ({ mobileClassName, trigger }: UserMenuProps) => {
  return (
    <Suspense fallback={<UserMenuSkeleton />}>
      <UserMenu mobileClassName={mobileClassName} trigger={trigger} />
    </Suspense>
  )
}

export default UserMenuWrapper
