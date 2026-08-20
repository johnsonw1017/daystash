import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import JournalCard from '@/app/(journal)/dashboard/_components/journal-card'
import JournalMonthSection, {
  type JournalMonth,
} from '@/app/(journal)/dashboard/_components/journal-month-section'
import {
  InitialJournalSkeletons,
  JournalCardSkeleton,
} from '@/app/(journal)/dashboard/_components/journal-skeletons'
import JournalTimelineScrubber from '@/app/(journal)/dashboard/_components/journal-timeline-scrubber'
import type { JournalListItem } from '@/lib/journals'

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}))

const journal: JournalListItem = {
  id: 'journal-1',
  title: 'Summer trip',
  slug: 'summer-trip',
  date: '2026-07-17',
  thumbnail: {
    publicId: 'journal/photo',
    width: 1200,
    height: 900,
  },
  placeCount: 2,
}

describe('dashboard journal components', () => {
  it('renders linked journal cards with formatted dates and titles', () => {
    render(<JournalCard journal={journal} />)

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/entries/summer-trip'
    )
    expect(screen.getByText('17 July')).toBeInTheDocument()
    expect(screen.getByText('Summer trip')).toBeInTheDocument()
  })

  it('renders unlinked untitled journals without a slug', () => {
    render(
      <JournalCard
        journal={{
          ...journal,
          title: '   ',
          slug: null,
          thumbnail: null,
        }}
      />
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Untitled Journal')).toBeInTheDocument()
  })

  it('renders journal month sections with a year anchor for first months', () => {
    const month: JournalMonth = {
      key: '2026-6',
      label: 'July',
      year: 2026,
      journals: [journal],
    }

    const { container } = render(
      <JournalMonthSection isFirstMonthOfYear month={month} />
    )

    expect(container.querySelector('#journal-year-2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'July' })).toBeInTheDocument()
    expect(screen.getByText('Summer trip')).toBeInTheDocument()
  })

  it('renders loading states for timeline and journal grids', () => {
    const { container } = render(
      <>
        <JournalCardSkeleton />
        <InitialJournalSkeletons />
      </>
    )

    expect(screen.getByLabelText('Loading journals')).toBeInTheDocument()
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(3)
  })

  it('supports keyboard navigation in the journal timeline scrubber', async () => {
    const onSelectIndex = vi.fn()

    render(
      <JournalTimelineScrubber
        activeIndex={0}
        months={[
          { month: '2026-07-01', journalCount: 2 },
          { month: '2026-06-01', journalCount: 1 },
        ]}
        onSelectIndex={onSelectIndex}
      />
    )

    const slider = screen.getByRole('slider', { name: 'Journal timeline' })
    slider.focus()
    await userEvent.keyboard('{ArrowDown}')

    expect(onSelectIndex).toHaveBeenCalledWith(1)
  })

  it('coalesces scrub movement into one timeline jump per frame', () => {
    vi.useFakeTimers()
    const onSelectIndex = vi.fn()

    render(
      <JournalTimelineScrubber
        activeIndex={0}
        months={[
          { month: '2026-07-01', journalCount: 2 },
          { month: '2026-06-01', journalCount: 1 },
          { month: '2026-05-01', journalCount: 1 },
        ]}
        onSelectIndex={onSelectIndex}
      />
    )

    const slider = screen.getByRole('slider', { name: 'Journal timeline' })
    const scrubber = slider.parentElement!
    scrubber.setPointerCapture = vi.fn()
    vi.spyOn(scrubber, 'getBoundingClientRect').mockReturnValue({
      bottom: 1000,
      height: 1000,
      left: 0,
      right: 40,
      top: 0,
      width: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(scrubber, { clientY: 50, pointerId: 1 })
    fireEvent.pointerMove(scrubber, { clientY: 500, pointerId: 1 })
    fireEvent.pointerMove(scrubber, { clientY: 950, pointerId: 1 })

    act(() => vi.advanceTimersByTime(20))

    expect(onSelectIndex).toHaveBeenCalledOnce()
    expect(onSelectIndex).toHaveBeenCalledWith(2, 'auto')
    vi.useRealTimers()
  })
})
