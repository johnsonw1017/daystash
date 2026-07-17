'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { MoonStar, Sun } from 'lucide-react'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  const isDark = resolvedTheme === 'dark'

  return (
    <DropdownMenuItem
      aria-label="Toggle dark mode"
      className="justify-center"
      disabled={!mounted}
      onSelect={(event) => {
        event.preventDefault()
        setTheme(isDark ? 'light' : 'dark')
      }}
    >
      <Sun
        className={cn(isDark ? 'text-muted-foreground/50' : 'text-foreground')}
        aria-hidden="true"
      />
      <Switch
        checked={mounted && isDark}
        className="pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />
      <MoonStar
        className={cn(isDark ? 'text-foreground' : 'text-muted-foreground/50')}
        aria-hidden="true"
      />
    </DropdownMenuItem>
  )
}

export default ThemeToggle
