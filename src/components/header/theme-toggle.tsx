'use client'

import { useAtom } from 'jotai'
import { useEffect, useSyncExternalStore } from 'react'
import { MoonStar, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { themeAtom } from '@/lib/atoms/theme'
import { cn } from '@/lib/utils'

const emptySubscribe = () => () => {}

const ThemeToggle = () => {
  const [theme, setTheme] = useAtom(themeAtom)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="size-4 text-foreground" aria-hidden="true" />
        <Switch checked={false} disabled aria-label="Toggle dark mode" />
        <MoonStar
          className="size-4 text-muted-foreground/50"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Sun
        className={cn(
          'size-4',
          isDark ? 'text-muted-foreground/50' : 'text-foreground'
        )}
        aria-hidden="true"
      />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        aria-label="Toggle dark mode"
      />
      <MoonStar
        className={cn(
          'size-4',
          isDark ? 'text-foreground' : 'text-muted-foreground/50'
        )}
        aria-hidden="true"
      />
    </div>
  )
}

export default ThemeToggle
