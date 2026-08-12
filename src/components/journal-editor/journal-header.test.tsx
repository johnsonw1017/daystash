import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JournalHeader from '@/components/journal-editor/journal-header'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'

vi.mock('@/components/journal-editor/hooks/use-journal-editor', () => ({
  default: vi.fn(),
}))

const mockedUseJournalEditor = vi.mocked(useJournalEditor)
const setJournalDate = vi.fn()

describe('JournalHeader', () => {
  beforeEach(() => {
    setJournalDate.mockReset()
    mockedUseJournalEditor.mockReturnValue({
      errorMessage: '',
      headerActions: null,
      isEditMode: true,
      isSaving: false,
      journalCreatedAt: '2026-08-17T10:00:00.000Z',
      journalDate: '2026-08-17',
      save: vi.fn(),
      setJournalDate,
      setTitle: vi.fn(),
      title: 'Kyoto',
      viewHref: '/entries/kyoto',
    } as ReturnType<typeof useJournalEditor>)
  })

  it('limits the journal date picker to the seven days before creation', async () => {
    render(<JournalHeader />)

    expect(
      screen.getByText('Choose from 10 Aug to 17 Aug 2026.')
    ).toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: /august 17th, 2026/i })
    )

    expect(
      screen.getByRole('heading', { name: 'Select journal date' })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /august 9th, 2026/i })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /august 18th, 2026/i })
    ).toBeDisabled()

    await userEvent.click(
      screen.getByRole('button', { name: /august 10th, 2026/i })
    )

    expect(setJournalDate).toHaveBeenCalledWith('2026-08-10')
  })
})
