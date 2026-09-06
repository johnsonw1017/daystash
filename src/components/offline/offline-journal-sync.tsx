'use client'

import { useCallback, useEffect } from 'react'
import { useAuth, useRefreshAuth } from '@/hooks/use-auth'
import { syncOfflineJournals } from '@/lib/offline-journal-sync'

const OfflineJournalSync = () => {
  const auth = useAuth()
  const refreshAuth = useRefreshAuth()

  const sync = useCallback(() => {
    if (!navigator.onLine) return

    if (!auth.userId) {
      void refreshAuth()
      return
    }

    void syncOfflineJournals(auth.userId)
  }, [auth.userId, refreshAuth])

  useEffect(() => {
    sync()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sync()
    }

    window.addEventListener('online', sync)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', sync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [sync])

  return null
}

export default OfflineJournalSync
