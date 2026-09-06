import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncOfflineJournals } from '@/lib/offline-journal-sync'
import type { OfflineJournal } from '@/lib/offline-journals'

const {
  completeOfflineJournalSync,
  failOfflineJournalSync,
  listOfflineJournals,
  markOfflineJournalSyncing,
  saveJournal,
} = vi.hoisted(() => ({
  completeOfflineJournalSync: vi.fn(),
  failOfflineJournalSync: vi.fn(),
  listOfflineJournals: vi.fn(),
  markOfflineJournalSyncing: vi.fn(),
  saveJournal: vi.fn(),
}))

vi.mock('@/app/(journal)/write/actions', () => ({ saveJournal }))
vi.mock('@/lib/offline-journals', () => ({
  completeOfflineJournalSync,
  failOfflineJournalSync,
  listOfflineJournals,
  markOfflineJournalSyncing,
}))

const journal: OfflineJournal = {
  id: 'offline-id',
  userId: 'user-id',
  title: 'Flight notes',
  date: '2026-09-06',
  blocks: [{ id: 'text-id', type: 'text', content: 'Window seat' }],
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
  revision: 3,
  syncState: 'pending',
  syncError: null,
}

describe('syncOfflineJournals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/dashboard')
    listOfflineJournals.mockResolvedValue([journal])
    markOfflineJournalSyncing.mockResolvedValue(true)
    saveJournal.mockResolvedValue({})
  })

  it('removes the exact local revision after Supabase confirms the save', async () => {
    await syncOfflineJournals('user-id')

    expect(saveJournal).toHaveBeenCalledWith({
      clientJournalId: 'offline-id',
      title: 'Flight notes',
      date: '2026-09-06',
      blocks: journal.blocks,
    })
    expect(completeOfflineJournalSync).toHaveBeenCalledWith(
      'offline-id',
      'user-id',
      3
    )
  })

  it('keeps a failed journal queued with its revision', async () => {
    const error = new Error('Network unavailable')
    saveJournal.mockRejectedValue(error)

    await syncOfflineJournals('another-user')

    expect(failOfflineJournalSync).toHaveBeenCalledWith(
      'offline-id',
      'another-user',
      3,
      error
    )
    expect(completeOfflineJournalSync).not.toHaveBeenCalled()
  })

  it('does not sync a journal while it is open in the offline editor', async () => {
    window.history.replaceState(null, '', '/offline#entry=offline-id')

    await syncOfflineJournals('open-user')

    expect(markOfflineJournalSyncing).not.toHaveBeenCalled()
    expect(saveJournal).not.toHaveBeenCalled()
  })
})
