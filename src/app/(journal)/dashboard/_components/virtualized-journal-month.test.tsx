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
    const currentYear = new Date().getFullYear()
    const refetch = vi.fn()
    vi.mocked(useJournalMonth).mockReturnValue({
      data: undefined,
      error: new Error('Request failed'),
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useJournalMonth>)

    render(
      <VirtualizedJournalMonth
        month={{ month: `${currentYear}-07-01`, journalCount: 3 }}
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

  it('includes the year in historical month section titles', () => {
    const historicalYear = new Date().getFullYear() - 1
    vi.mocked(useJournalMonth).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJournalMonth>)

    render(
      <VirtualizedJournalMonth
        month={{ month: `${historicalYear}-07-01`, journalCount: 0 }}
        onSelectedDateFocused={vi.fn()}
        selectedDate={null}
        userId="user-id"
      />
    )

    expect(
      screen.getByRole('heading', { name: `July ${historicalYear}` })
    ).toBeInTheDocument()
  })
})
