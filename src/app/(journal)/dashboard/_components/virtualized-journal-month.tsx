'use client'

import { useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import {
  useJournalMonth,
  type JournalTimelineMonth,
} from '@/hooks/use-journals'
import { JournalCardSkeleton } from './journal-skeletons'
import JournalMonthSection from './journal-month-section'

type VirtualizedJournalMonthProps = {
  month: JournalTimelineMonth
  onSelectedDateFocused: () => void
  selectedDate: string | null
  userId?: string
}

const monthFormatter = new Intl.DateTimeFormat('en-AU', { month: 'long' })

const VirtualizedJournalMonth = ({
  month,
  onSelectedDateFocused,
  selectedDate,
  userId,
}: VirtualizedJournalMonthProps) => {
  const { data: journals, isLoading } = useJournalMonth(userId, month.month)
  const monthDate = parseISO(month.month)

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

  if (isLoading || !journals) {
    return (
      <section aria-label={`Loading ${monthFormatter.format(monthDate)}`}>
        <div className="bg-muted mb-4 h-8 w-32 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: month.journalCount }, (_, index) => (
            <JournalCardSkeleton key={index} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <JournalMonthSection
      isFirstMonthOfYear
      month={{
        key: format(monthDate, 'yyyy-M'),
        label: monthFormatter.format(monthDate),
        year: monthDate.getFullYear(),
        journals,
      }}
      selectedDate={selectedDate}
    />
  )
}

export default VirtualizedJournalMonth
