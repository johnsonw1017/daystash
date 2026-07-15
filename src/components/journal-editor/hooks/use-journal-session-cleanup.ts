'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useStore } from 'jotai'
import {
  blocksAtom,
  isJournalSavingAtom,
  journalIdAtom,
  lastSavedTitleAtom,
  savedBlocksAtom,
  sessionAssetIdsAtom,
  titleAtom,
} from '@/components/journal-editor/atoms'
import { normalizeEditorBlocks } from '@/components/journal-editor/utils'

const useJournalSessionCleanup = () => {
  const store = useStore()
  const cleanupSentRef = useRef(false)

  const discardSessionChanges = useCallback(() => {
    if (cleanupSentRef.current || store.get(isJournalSavingAtom)) return

    const journalId = store.get(journalIdAtom)
    const sessionAssetIds = store.get(sessionAssetIdsAtom)
    const currentBlocks = normalizeEditorBlocks(store.get(blocksAtom))
    const savedBlocks = store.get(savedBlocksAtom)
    const isDirty =
      JSON.stringify(currentBlocks) !== JSON.stringify(savedBlocks) ||
      store.get(titleAtom) !== store.get(lastSavedTitleAtom)

    if (!journalId) return
    if (!isDirty && sessionAssetIds.length === 0) return

    cleanupSentRef.current = true

    const payload = JSON.stringify({
      journalId,
      sessionAssetIds,
    })

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/journals/discard-session',
        new Blob([payload], { type: 'application/json' })
      )
      return
    }

    void fetch('/api/journals/discard-session', {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    })
  }, [store])

  useEffect(() => {
    const handlePageHide = () => {
      discardSessionChanges()
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [discardSessionChanges])

  useEffect(
    () => () => {
      discardSessionChanges()
    },
    [discardSessionChanges]
  )
}

export default useJournalSessionCleanup
