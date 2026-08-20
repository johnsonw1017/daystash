import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useJournalMonth, useJournalTimelineMonths } from '@/hooks/use-journals'
import { JournalCalendarDrawer } from './mobile-calendar-action'

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: () => ({ isLoading: false, user: { id: 'user-id' } }),
}))

vi.mock('@/hooks/use-journals', () => ({
  useJournalMonth: vi.fn(),
  useJournalTimelineMonths: vi.fn(),
}))

describe('JournalCalendarDrawer', () => {
  it('offers year navigation across the journal date range', async () => {
    vi.mocked(useJournalTimelineMonths).mockReturnValue({
      data: [
        { month: '2026-08-01', journalCount: 1 },
        { month: '2016-09-01', journalCount: 1 },
      ],
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJournalTimelineMonths>)
    vi.mocked(useJournalMonth).mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJournalMonth>)

    render(
      <JournalCalendarDrawer
        trigger={<button type="button">Calendar</button>}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }))

    const yearSelector = await screen.findByRole('combobox')
    expect(yearSelector).toHaveValue('2026')
    expect(yearSelector).toContainHTML('<option value="2016">2016</option>')
  })

  it('shows a retry action when the timeline query fails', async () => {
    const refetchTimeline = vi.fn()
    vi.mocked(useJournalTimelineMonths).mockReturnValue({
      data: [],
      error: new Error('Request failed'),
      refetch: refetchTimeline,
    } as unknown as ReturnType<typeof useJournalTimelineMonths>)
    vi.mocked(useJournalMonth).mockReturnValue({
      data: [],
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJournalMonth>)

    render(
      <JournalCalendarDrawer
        trigger={<button type="button">Calendar</button>}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Calendar' }))
    expect(
      await screen.findByText('Journal calendar could not be loaded')
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetchTimeline).toHaveBeenCalledOnce()
  })
})
