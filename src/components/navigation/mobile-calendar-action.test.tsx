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
