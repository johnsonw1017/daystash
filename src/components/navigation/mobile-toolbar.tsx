'use client'

import {
  forwardRef,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MobileToolbarProps = {
  label: string
  children: ReactNode
}

const MobileToolbar = ({ children, label }: MobileToolbarProps) => (
  <div
    className="bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur lg:hidden"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  >
    <nav
      aria-label={label}
      className="mx-auto flex min-h-18 w-full max-w-200 items-stretch gap-1 px-2 py-2"
    >
      {children}
    </nav>
  </div>
)

type MobileToolbarActionProps = Omit<ComponentProps<'button'>, 'children'> & {
  active?: boolean
  href?: string
  icon: ComponentType<{ className?: string }>
  label: string
  variant?: 'default' | 'accent' | 'ghost'
}

const MobileToolbarAction = forwardRef<
  HTMLButtonElement,
  MobileToolbarActionProps
>(function MobileToolbarAction(
  {
    active = false,
    className,
    disabled,
    href,
    icon: Icon,
    label,
    type = 'button',
    variant = 'ghost',
    ...buttonProps
  },
  ref
) {
  const content = (
    <>
      <Icon className="size-6" />
      <span className="text-xs">{label}</span>
    </>
  )
  const actionClassName = cn(
    'h-auto min-h-14 flex-1 flex-col gap-1 rounded-xl px-2 py-2 shadow-none',
    active && 'text-primary',
    className
  )
  if (href) {
    return (
      <Button variant={variant} className={actionClassName} asChild>
        <Link href={href} aria-current={active ? 'page' : undefined}>
          {content}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      className={actionClassName}
      aria-pressed={active || undefined}
      disabled={disabled}
      {...buttonProps}
    >
      {content}
    </Button>
  )
})

export { MobileToolbar, MobileToolbarAction }
