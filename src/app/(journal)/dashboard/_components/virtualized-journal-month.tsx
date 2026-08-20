'use client'

import { useEffect } from 'react'
import { parseISO } from 'date-fns'
import {
  useJournalMonth,
  type JournalTimelineMonth,
} from '@/hooks/use-journals'
import JournalLoadError from '@/components/journal-load-error'
import { JournalCardSkeleton } from './journal-skeletons'
import JournalMonthSection from './journal-month-section'

type VirtualizedJournalMonthProps = {
  month: JournalTimelineMonth
  onSelectedDateFocused: () => void
  selectedDate: string | null
  userId?: string
}

const monthFormatter = new Intl.DateTimeFormat('en-AU', { month: 'long' })
const historicalMonthFormatter = new Intl.DateTimeFormat('en-AU', {
  month: 'long',
  year: 'numeric',
})

const getMonthLabel = (date: Date) =>
  date.getFullYear() === new Date().getFullYear()
    ? monthFormatter.format(date)
    : historicalMonthFormatter.format(date)

const VirtualizedJournalMonth = ({
  month,
  onSelectedDateFocused,
  selectedDate,
  userId,
}: VirtualizedJournalMonthProps) => {
  const {
    data: journals,
    error,
    isLoading,
    refetch,
  } = useJournalMonth(userId, month.month)
  const monthDate = parseISO(month.month)
  const monthLabel = getMonthLabel(monthDate)

  useEffect(() => {
    if (
      !selectedDate ||
      !journals?.some((journal) => journal.date === selectedDate)
    ) {
      return
    }

    const target = document.querySelector<HTMLElement>(
      `[data-journal-date="${selectedDate}"]`
    )

    if (!target) return

    target.scrollIntoView({ behavior: 'auto', block: 'center' })
    onSelectedDateFocused()
  }, [journals, onSelectedDateFocused, selectedDate])

  if (isLoading) {
    return (
      <section aria-label={`Loading ${monthLabel}`}>
        <div className="bg-muted mb-4 h-8 w-32 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: month.journalCount }, (_, index) => (
            <JournalCardSkeleton key={index} />
          ))}
        </div>
      </section>
    )
  }

  if (error || !journals) {
    return (
      <JournalLoadError
        title={`${monthLabel} journals could not be loaded`}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <JournalMonthSection
      month={{
        key: month.month,
        label: monthLabel,
        journals,
      }}
      selectedDate={selectedDate}
    />
  )
}

export default VirtualizedJournalMonth
