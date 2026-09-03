import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteJournal } from '@/app/(journal)/write/actions'
import DeleteJournalButton from '@/app/(journal)/entries/[slug]/edit/_components/delete-journal-button'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/app/(journal)/write/actions', () => ({
  deleteJournal: vi.fn(),
}))

const mockedDeleteJournal = vi.mocked(deleteJournal)

describe('DeleteJournalButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedDeleteJournal.mockResolvedValue({ deleted: true })
  })

  it('deletes the journal, clears its cached lookup, and returns home', async () => {
    const queryClient = new QueryClient()
    const removeQueries = vi.spyOn(queryClient, 'removeQueries')

    render(
      <QueryClientProvider client={queryClient}>
        <DeleteJournalButton journalId="journal-id" slug="kyoto" />
      </QueryClientProvider>
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete journal' })
    )
    expect(screen.getByText('Delete this journal?')).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Permanently delete' })
    )

    await waitFor(() => {
      expect(mockedDeleteJournal).toHaveBeenCalledWith({
        journalId: 'journal-id',
      })
      expect(push).toHaveBeenCalledWith('/dashboard')
    })
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['journals', 'slug', 'kyoto'],
    })
  })
})
