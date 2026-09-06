'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, CloudOff, RefreshCw, SquarePen } from 'lucide-react'
import JournalEditor from '@/components/journal-editor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { SaveJournalInput, SaveJournalResult } from '@/lib/journals'
import useOnlineStatus from '@/hooks/use-online-status'
import { syncOfflineJournals } from '@/lib/offline-journal-sync'
import {
  createOfflineJournal,
  getRememberedOfflineUser,
  observeOfflineJournals,
  saveOfflineJournal,
  type OfflineJournal,
} from '@/lib/offline-journals'

const getEntryIdFromHash = () => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('entry')
}

type PersistenceState = 'saved' | 'saving' | 'error'

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'This journal could not be saved.'

const OfflineJournals = () => {
  const [userId, setUserId] = useState<string | null>(null)
  const [journals, setJournals] = useState<OfflineJournal[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isOnline = useOnlineStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [persistenceState, setPersistenceState] =
    useState<PersistenceState>('saved')
  const [persistenceError, setPersistenceError] = useState('')
  const persistenceRevisionRef = useRef(0)

  useEffect(() => {
    setUserId(getRememberedOfflineUser())
    setSelectedId(getEntryIdFromHash())

    const handleHashChange = () => setSelectedId(getEntryIdFromHash())

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const subscription = observeOfflineJournals(
      userId,
      (nextJournals) => {
        setJournals(nextJournals)
        setLoadError(false)
      },
      () => setLoadError(true)
    )

    return () => subscription.unsubscribe()
  }, [userId])

  const selectedJournal = useMemo(
    () => journals.find((journal) => journal.id === selectedId) ?? null,
    [journals, selectedId]
  )

  useEffect(() => {
    if (selectedId && journals.length > 0 && !selectedJournal) {
      window.history.replaceState(null, '', '/offline')
      setSelectedId(null)
    }
  }, [journals.length, selectedId, selectedJournal])

  const openJournal = (id: string) => {
    persistenceRevisionRef.current += 1
    setPersistenceState('saved')
    setPersistenceError('')
    window.history.pushState(null, '', `/offline#entry=${id}`)
    setSelectedId(id)
  }

  const closeJournal = () => {
    persistenceRevisionRef.current += 1
    window.history.pushState(null, '', '/offline')
    setSelectedId(null)

    if (userId && navigator.onLine) {
      window.setTimeout(() => void syncOfflineJournals(userId), 500)
    }
  }

  const createJournal = async () => {
    if (!userId) return

    try {
      const journal = await createOfflineJournal(
        userId,
        format(new Date(), 'yyyy-MM-dd')
      )
      openJournal(journal.id)
    } catch {
      setLoadError(true)
    }
  }

  const handlePersistenceStart = useCallback(() => {
    persistenceRevisionRef.current += 1
    setPersistenceState('saving')
  }, [])

  const saveDraft = useCallback(
    async (input: SaveJournalInput) => {
      const persistenceRevision = persistenceRevisionRef.current

      if (!selectedId || !userId) {
        throw new Error('Offline journal not found')
      }

      try {
        const journal = await saveOfflineJournal(selectedId, userId, input)
        if (persistenceRevision === persistenceRevisionRef.current) {
          setPersistenceState('saved')
          setPersistenceError('')
        }
        return journal
      } catch (error) {
        if (persistenceRevision === persistenceRevisionRef.current) {
          setPersistenceState('error')
          setPersistenceError(getErrorMessage(error))
        }
        throw error
      }
    },
    [selectedId, userId]
  )

  const saveDraftFromEditor = useCallback(
    async (input: SaveJournalInput): Promise<SaveJournalResult> => {
      const journal = await saveDraft(input)
      return {
        journalId: journal.id,
        blocks: journal.blocks,
        places: [],
        thumbnailAssetId: null,
      }
    },
    [saveDraft]
  )

  const syncNow = async () => {
    if (!userId || !navigator.onLine) return

    setIsSyncing(true)
    try {
      await syncOfflineJournals(userId)
    } finally {
      setIsSyncing(false)
    }
  }

  if (!userId) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Offline journals unavailable</CardTitle>
            <CardDescription>
              Sign in to Daystash while online once before creating offline
              journals on this device.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  if (selectedJournal) {
    return (
      <main className="px-4 pb-24">
        <div className="mx-auto flex w-full max-w-200 items-center justify-between py-4">
          <Button type="button" variant="ghost" onClick={closeJournal}>
            <ArrowLeft />
            Offline journals
          </Button>
          <Badge
            variant={persistenceState === 'error' ? 'destructive' : 'secondary'}
          >
            <CloudOff />
            {persistenceState === 'saving'
              ? 'Saving on this device…'
              : persistenceState === 'error'
                ? 'Not saved'
                : 'Saved on this device'}
          </Badge>
        </div>
        {persistenceState === 'error' && (
          <Alert variant="destructive" className="mx-auto mb-4 max-w-200">
            <AlertDescription>
              {persistenceError} Keep this page open and try Save again.
            </AlertDescription>
          </Alert>
        )}
        <JournalEditor
          key={selectedJournal.id}
          initialJournalId={selectedJournal.id}
          initialTitle={selectedJournal.title}
          initialDate={selectedJournal.date}
          initialCreatedAt={selectedJournal.createdAt}
          initialBlocks={selectedJournal.blocks}
          isEditMode
          isOfflineDraft
          onDraftChange={saveDraft}
          onDraftSaveStart={handlePersistenceStart}
          saveHandler={saveDraftFromEditor}
          successMessage="Saved on this device"
          textOnly
        />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Offline journals
          </h1>
          <p className="text-muted-foreground mt-2">
            These text entries stay on this device until they sync.
          </p>
        </div>
        <Button type="button" variant="accent" onClick={() => void createJournal()}>
          <SquarePen />
          New journal
        </Button>
      </div>

      {isOnline && journals.length > 0 && (
        <Alert className="mb-6">
          <RefreshCw />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              You’re online. Daystash will sync these journals automatically.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSyncing}
              onClick={() => void syncNow()}
            >
              {isSyncing ? 'Syncing…' : 'Sync now'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loadError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Offline journals could not be opened on this device.
          </AlertDescription>
        </Alert>
      ) : journals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No offline journals</CardTitle>
            <CardDescription>
              Create a text journal now, or return to your synced stash when
              you’re online.
            </CardDescription>
          </CardHeader>
          {isOnline && (
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Return to your stash</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {journals.map((journal) => (
            <button
              key={journal.id}
              type="button"
              className="bg-card hover:bg-accent/40 focus-visible:ring-ring flex w-full items-center justify-between gap-4 rounded-xl border p-5 text-left shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              onClick={() => openJournal(journal.id)}
            >
              <span className="min-w-0">
                <span className="block truncate font-serif text-xl font-semibold">
                  {journal.title.trim() || 'Untitled Journal'}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {journal.date}
                </span>
              </span>
              <Badge
                variant={journal.syncState === 'failed' ? 'destructive' : 'secondary'}
              >
                {journal.syncState === 'syncing'
                  ? 'Syncing'
                  : journal.syncState === 'failed'
                    ? 'Retry needed'
                    : 'Waiting to sync'}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}

export default OfflineJournals
