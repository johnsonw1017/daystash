import { render, screen } from '@testing-library/react'
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
import YearTimeline from '@/app/(journal)/dashboard/_components/year-timeline'
import type { JournalListItem } from '@/lib/journals'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}))

const journal: JournalListItem = {
  id: 'journal-1',
  title: 'Summer trip',
  slug: 'summer-trip',
  created_at: '2026-07-17T00:00:00.000Z',
  thumbnail: {
    publicId: 'journal/photo',
    width: 1200,
    height: 900,
  },
}

describe('dashboard journal components', () => {
  it('renders linked journal cards with formatted dates and titles', () => {
    render(<JournalCard journal={journal} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/entries/summer-trip')
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

    const { container } = render(<JournalMonthSection isFirstMonthOfYear month={month} />)

    expect(container.querySelector('#journal-year-2026')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'July' })).toBeInTheDocument()
    expect(screen.getByText('Summer trip')).toBeInTheDocument()
  })

  it('renders year buttons and reports selected years', async () => {
    const onSelectYear = vi.fn()

    render(
      <YearTimeline
        activeYear={2026}
        isLoading={false}
        onSelectYear={onSelectYear}
        years={[2026, 2025]}
      />
    )

    expect(screen.getByRole('button', { name: '2026' })).toHaveAttribute(
      'aria-current',
      'true'
    )

    await userEvent.click(screen.getByRole('button', { name: '2025' }))

    expect(onSelectYear).toHaveBeenCalledWith(2025)
  })

  it('renders loading states for timeline and journal grids', () => {
    const { container } = render(
      <>
        <YearTimeline activeYear={null} isLoading onSelectYear={vi.fn()} years={[]} />
        <JournalCardSkeleton />
        <InitialJournalSkeletons />
      </>
    )

    expect(screen.getByLabelText('Loading journals')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(4)
  })
})
