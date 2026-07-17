'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { MoonStar, Sun } from 'lucide-react'
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
    <div className="flex items-center justify-center gap-1 px-2 py-1">
      <Sun
        className={cn(
          'size-3.5',
          isDark ? 'text-muted-foreground/50' : 'text-foreground'
        )}
        aria-hidden="true"
      />
      <Switch
        size="sm"
        checked={mounted && isDark}
        disabled={!mounted}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
      <MoonStar
        className={cn(
          'size-3.5',
          isDark ? 'text-foreground' : 'text-muted-foreground/50'
        )}
        aria-hidden="true"
      />
    </div>
  )
}

export default ThemeToggle
