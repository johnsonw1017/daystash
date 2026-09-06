import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OfflineJournals from '@/components/offline/offline-journals'
import type { OfflineJournal } from '@/lib/offline-journals'

const { createOfflineJournal, observeOfflineJournals } = vi.hoisted(() => ({
  createOfflineJournal: vi.fn(),
  observeOfflineJournals: vi.fn(),
}))

vi.mock('@/lib/offline-journals', () => ({
  createOfflineJournal,
  getRememberedOfflineUser: () => 'user-id',
  observeOfflineJournals,
  saveOfflineJournal: vi.fn(),
}))

vi.mock('@/lib/offline-journal-sync', () => ({
  syncOfflineJournals: vi.fn(),
}))

vi.mock('@/components/journal-editor', () => ({
  default: ({ initialTitle, textOnly }: { initialTitle: string; textOnly: boolean }) => (
    <div>
      Editing {initialTitle} {textOnly ? 'text only' : ''}
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
})
