import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OfflineJournals from '@/components/offline/offline-journals'
import type { OfflineJournal } from '@/lib/offline-journals'

const { createOfflineJournal, observeOfflineJournals, saveOfflineJournal } =
  vi.hoisted(() => ({
    createOfflineJournal: vi.fn(),
    observeOfflineJournals: vi.fn(),
    saveOfflineJournal: vi.fn(),
  }))

vi.mock('@/lib/offline-journals', () => ({
  createOfflineJournal,
  getRememberedOfflineUser: () => 'user-id',
  observeOfflineJournals,
  saveOfflineJournal,
}))

vi.mock('@/lib/offline-journal-sync', () => ({
  syncOfflineJournals: vi.fn(),
}))

vi.mock('@/components/journal-editor', () => ({
  default: ({
    initialTitle,
    onDraftChange,
    onDraftSaveStart,
    textOnly,
  }: {
    initialTitle: string
    onDraftChange: (input: unknown) => Promise<unknown>
    onDraftSaveStart: () => void
    textOnly: boolean
  }) => (
    <div>
      Editing {initialTitle} {textOnly ? 'text only' : ''}
      <button
        type="button"
        onClick={() => {
          onDraftSaveStart()
          void onDraftChange({}).catch(() => undefined)
        }}
      >
        Simulate autosave
      </button>
    </div>
  ),
}))

const journal: OfflineJournal = {
  id: 'offline-id',
  userId: 'user-id',
  title: 'Flight notes',
  date: '2026-09-06',
  blocks: [{ id: 'text-id', type: 'text', content: 'Window seat' }],
  createdAt: '2026-09-06T00:00:00.000Z',
  updatedAt: '2026-09-06T00:00:00.000Z',
  revision: 1,
  syncState: 'pending',
  syncError: null,
}

describe('OfflineJournals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/offline')
    observeOfflineJournals.mockImplementation(
      (_userId, onChange: (journals: OfflineJournal[]) => void) => {
        onChange([journal])
        return { unsubscribe: vi.fn() }
      }
    )
    createOfflineJournal.mockResolvedValue(journal)
    saveOfflineJournal.mockResolvedValue(journal)
  })

  it('lists and opens an offline text journal without route navigation', async () => {
    const user = userEvent.setup()
    render(<OfflineJournals />)

    await user.click(
      await screen.findByRole('button', { name: /flight notes/i })
    )

    expect(screen.getByText(/editing flight notes text only/i)).toBeInTheDocument()
    expect(window.location.hash).toBe('#entry=offline-id')
  })

  it('creates another local journal for the remembered user', async () => {
    const user = userEvent.setup()
    render(<OfflineJournals />)

    await user.click(await screen.findByRole('button', { name: /new journal/i }))

    expect(createOfflineJournal).toHaveBeenCalledWith(
      'user-id',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    )
    expect(window.location.hash).toBe('#entry=offline-id')
  })

  it('warns when the latest journal revision cannot be saved locally', async () => {
    const user = userEvent.setup()
    saveOfflineJournal.mockRejectedValue(new Error('IndexedDB is unavailable'))
    render(<OfflineJournals />)

    await user.click(
      await screen.findByRole('button', { name: /flight notes/i })
    )
    await user.click(screen.getByRole('button', { name: /simulate autosave/i }))

    expect(await screen.findByText('Not saved')).toBeInTheDocument()
    expect(screen.getByText(/indexeddb is unavailable/i)).toBeInTheDocument()
  })

  it('does not report an older write as the latest saved revision', async () => {
    const user = userEvent.setup()
    let finishFirstSave: ((journal: OfflineJournal) => void) | undefined
    let finishSecondSave: ((journal: OfflineJournal) => void) | undefined

    saveOfflineJournal
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirstSave = resolve
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishSecondSave = resolve
          })
      )
    render(<OfflineJournals />)

    await user.click(
      await screen.findByRole('button', { name: /flight notes/i })
    )
    const autosave = screen.getByRole('button', { name: /simulate autosave/i })
    await user.click(autosave)
    await user.click(autosave)

    await act(async () => finishFirstSave?.(journal))
    expect(screen.getByText('Saving on this device…')).toBeInTheDocument()

    await act(async () => finishSecondSave?.(journal))
    expect(screen.getByText('Saved on this device')).toBeInTheDocument()
  })
})
