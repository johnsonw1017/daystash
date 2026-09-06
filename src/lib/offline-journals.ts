'use client'

import Dexie, { type EntityTable } from 'dexie'
import { liveQuery } from 'dexie'
import type { JournalBlock, SaveJournalInput } from '@/lib/journals'

const LAST_OFFLINE_USER_KEY = 'daystash:last-offline-user'

export type OfflineJournal = {
  id: string
  userId: string
  title: string
  date: string
  blocks: JournalBlock[]
  createdAt: string
  updatedAt: string
  revision: number
  syncState: 'pending' | 'syncing' | 'failed'
  syncError: string | null
}

class DaystashOfflineDatabase extends Dexie {
  offlineJournals!: EntityTable<OfflineJournal, 'id'>

  constructor() {
    super('daystash-offline')
    this.version(1).stores({
      offlineJournals: 'id, userId, updatedAt, [userId+updatedAt]',
    })
  }
}

let database: DaystashOfflineDatabase | null = null

const getDatabase = () => {
  database ??= new DaystashOfflineDatabase()
  return database
}

const journalContentMatches = (
  journal: OfflineJournal,
  input: SaveJournalInput
) =>
  journal.title === input.title &&
  journal.date === input.date &&
  JSON.stringify(journal.blocks) === JSON.stringify(input.blocks)

export const rememberOfflineUser = (userId: string) => {
  window.localStorage.setItem(LAST_OFFLINE_USER_KEY, userId)
}

export const forgetOfflineUser = () => {
  window.localStorage.removeItem(LAST_OFFLINE_USER_KEY)
}

export const getRememberedOfflineUser = () =>
  window.localStorage.getItem(LAST_OFFLINE_USER_KEY)

export const createOfflineJournal = async (
  userId: string,
  date: string
): Promise<OfflineJournal> => {
  const timestamp = new Date().toISOString()
  const journal: OfflineJournal = {
    id: crypto.randomUUID(),
    userId,
    title: '',
    date,
    blocks: [{ id: crypto.randomUUID(), type: 'text', content: '' }],
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 1,
    syncState: 'pending',
    syncError: null,
  }

  await getDatabase().offlineJournals.add(journal)
  return journal
}

export const getOfflineJournal = async (id: string, userId: string) => {
  const journal = await getDatabase().offlineJournals.get(id)
  return journal?.userId === userId ? journal : undefined
}

export const listOfflineJournals = (userId: string) =>
  getDatabase()
    .offlineJournals.where('userId')
    .equals(userId)
    .sortBy('updatedAt')
    .then((journals) => journals.reverse())

export const observeOfflineJournals = (
  userId: string,
  onChange: (journals: OfflineJournal[]) => void,
  onError: (error: unknown) => void
) =>
  liveQuery(() => listOfflineJournals(userId)).subscribe({
    next: onChange,
    error: onError,
  })

export const saveOfflineJournal = async (
  id: string,
  userId: string,
  input: SaveJournalInput
) => {
  const db = getDatabase()

  return db.transaction('rw', db.offlineJournals, async () => {
    const current = await db.offlineJournals.get(id)
    if (!current || current.userId !== userId) {
      throw new Error('Offline journal not found')
    }

    if (journalContentMatches(current, input)) {
      return current
    }

    const nextJournal: OfflineJournal = {
      ...current,
      title: input.title,
      date: input.date ?? current.date,
      blocks: input.blocks.filter((block) => block.type !== 'image'),
      updatedAt: new Date().toISOString(),
      revision: current.revision + 1,
      syncState: 'pending',
      syncError: null,
    }

    await db.offlineJournals.put(nextJournal)
    return nextJournal
  })
}

export const markOfflineJournalSyncing = async (
  id: string,
  userId: string,
  revision: number
) => {
  const journal = await getOfflineJournal(id, userId)
  if (!journal || journal.revision !== revision) return false

  await getDatabase().offlineJournals.update(id, {
    syncState: 'syncing',
    syncError: null,
  })
  return true
}

export const completeOfflineJournalSync = async (
  id: string,
  userId: string,
  revision: number
) => {
  const journal = await getOfflineJournal(id, userId)
  if (!journal) return

  if (journal.revision === revision) {
    await getDatabase().offlineJournals.delete(id)
    return
  }

  await getDatabase().offlineJournals.update(id, {
    syncState: 'pending',
    syncError: null,
  })
}

export const failOfflineJournalSync = async (
  id: string,
  userId: string,
  revision: number,
  error: unknown
) => {
  const journal = await getOfflineJournal(id, userId)
  if (!journal || journal.revision !== revision) return

  await getDatabase().offlineJournals.update(id, {
    syncState: 'failed',
    syncError: error instanceof Error ? error.message : 'Sync failed',
  })
}

export const resetOfflineJournalDatabaseForTests = () => {
  database?.close()
  database = null
}
