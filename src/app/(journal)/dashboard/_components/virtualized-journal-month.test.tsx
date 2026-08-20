import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useJournalMonth } from '@/hooks/use-journals'
import VirtualizedJournalMonth from './virtualized-journal-month'

vi.mock('@/hooks/use-journals', () => ({
  useJournalMonth: vi.fn(),
}))

describe('VirtualizedJournalMonth', () => {
  it('shows a retry action when a month query fails', async () => {
    const refetch = vi.fn()
    vi.mocked(useJournalMonth).mockReturnValue({
      data: undefined,
      error: new Error('Request failed'),
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useJournalMonth>)

    render(
      <VirtualizedJournalMonth
        month={{ month: '2026-07-01', journalCount: 3 }}
        onSelectedDateFocused={vi.fn()}
        selectedDate={null}
        userId="user-id"
      />
    )

    expect(
      screen.getByText('July journals could not be loaded')
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Loading July')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
