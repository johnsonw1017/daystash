'use client'

import { usePathname } from 'next/navigation'
import { CloudOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import useOnlineStatus from '@/hooks/use-online-status'

const OfflineJournalAccess = () => {
  const pathname = usePathname()
  const isOnline = useOnlineStatus()

  if (isOnline || pathname === '/offline') return null

  return (
    <Alert className="bg-background fixed inset-x-4 top-4 z-70 mx-auto max-w-xl shadow-lg">
      <CloudOff />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>You’re offline. Synced journals are temporarily unavailable.</span>
        <Button size="sm" variant="outline" asChild>
          <a href="/offline">Open offline journals</a>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default OfflineJournalAccess
