'use client'

import { useEffect, useState } from 'react'
import { CloudOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { observeOfflineJournals } from '@/lib/offline-journals'

const OfflineJournalNotice = () => {
  const auth = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!auth.userId) return

    const subscription = observeOfflineJournals(
      auth.userId,
      (journals) => setCount(journals.length),
      () => setCount(0)
    )

    return () => subscription.unsubscribe()
  }, [auth.userId])

  if (!auth.userId || count === 0) return null

  return (
    <Alert className="mb-8">
      <CloudOff />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {count} offline journal{count === 1 ? '' : 's'} waiting to sync.
        </span>
        <Button size="sm" variant="outline" asChild>
          <a href="/offline">View offline journals</a>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default OfflineJournalNotice
