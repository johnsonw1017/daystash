'use client'

import { saveJournal } from '@/app/(journal)/write/actions'
import {
  completeOfflineJournalSync,
  failOfflineJournalSync,
  listOfflineJournals,
  markOfflineJournalSyncing,
} from '@/lib/offline-journals'

const activeSyncs = new Map<string, Promise<void>>()

const isJournalOpenInOfflineEditor = (journalId: string) => {
  if (window.location.pathname !== '/offline') return false

  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('entry') === journalId
}

const runSync = async (userId: string) => {
  const journals = await listOfflineJournals(userId)

  for (const journal of journals) {
    if (isJournalOpenInOfflineEditor(journal.id)) continue

    const canSync = await markOfflineJournalSyncing(
      journal.id,
      userId,
      journal.revision
    )
    if (!canSync) continue

    try {
      await saveJournal({
        clientJournalId: journal.id,
        title: journal.title,
        date: journal.date,
        blocks: journal.blocks,
      })
      await completeOfflineJournalSync(journal.id, userId, journal.revision)
    } catch (error) {
      await failOfflineJournalSync(
        journal.id,
        userId,
        journal.revision,
        error
      )
    }
  }
}

export const syncOfflineJournals = (userId: string) => {
  const activeSync = activeSyncs.get(userId)
  if (activeSync) return activeSync

  const sync = runSync(userId).finally(() => activeSyncs.delete(userId))
  activeSyncs.set(userId, sync)
  return sync
}
