'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, SquarePen } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import JournalLoadError from '@/components/journal-load-error'
import { useAuth } from '@/hooks/use-auth'
import { useJournalTimelineMonths } from '@/hooks/use-journals'
import { dashboardCalendarDateAtom } from '@/lib/atoms/dashboard-navigation'
import { JournalCalendarDrawer } from '@/components/navigation/mobile-calendar-action'
import { InitialJournalSkeletons } from './journal-skeletons'
import JournalTimelineScrubber from './journal-timeline-scrubber'
import VirtualizedJournalMonth from './virtualized-journal-month'

const DashboardJournals = () => {
  const auth = useAuth()
  const calendarSelection = useAtomValue(dashboardCalendarDateAtom)
  const setCalendarSelection = useSetAtom(dashboardCalendarDateAtom)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [readyCalendarRequestId, setReadyCalendarRequestId] = useState<
    number | null
  >(null)
  const {
    data: months = [],
    error,
    isLoading,
    refetch,
  } = useJournalTimelineMonths(auth.userId ?? undefined)
  const isInitialLoading = auth.isLoading || isLoading

  useEffect(() => {
    if (!calendarSelection) return

    const { date, requestId } = calendarSelection
    const monthIndex = months.findIndex((month) =>
      date.startsWith(month.month.slice(0, 7))
    )
    if (monthIndex < 0) return

    let cancelled = false

    virtuosoRef.current?.scrollIntoView({
      index: monthIndex,
      align: 'start',
      behavior: 'auto',
      done: () => {
        if (!cancelled) setReadyCalendarRequestId(requestId)
      },
    })

    return () => {
      cancelled = true
    }
  }, [calendarSelection, months])

  const focusedCalendarDate =
    calendarSelection?.requestId === readyCalendarRequestId
      ? calendarSelection.date
      : null

  const selectMonth = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      virtuosoRef.current?.scrollToIndex({
        index,
        align: 'start',
        behavior: behavior === 'instant' ? 'auto' : behavior,
      })
    },
    []
  )

  const clearCalendarSelection = useCallback(
    () => setCalendarSelection(null),
    [setCalendarSelection]
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Stash</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse your journals by month and year.
          </p>
        </div>
      </div>

      <div className="fixed right-6 bottom-6 z-40 hidden items-center gap-2 lg:flex">
        <JournalCalendarDrawer
          direction="right"
          trigger={
            <Button variant="outline" className="shadow-lg">
              <CalendarDays />
              Calendar
            </Button>
          }
        />
        <Button variant="accent" className="shadow-lg" asChild>
          <Link href="/write">
            <SquarePen />
            Write
          </Link>
        </Button>
      </div>

      {isInitialLoading ? (
        <InitialJournalSkeletons />
      ) : error ? (
        <JournalLoadError
          title="Journals could not be loaded"
          onRetry={() => void refetch()}
        />
      ) : months.length ? (
        <>
          <Virtuoso
            ref={virtuosoRef}
            useWindowScroll
            data={months}
            computeItemKey={(_, month) => month.month}
            overscan={480}
            rangeChanged={({ startIndex }) => setActiveIndex(startIndex)}
            itemContent={(_, month) => (
              <div className="pb-10">
                <VirtualizedJournalMonth
                  month={month}
                  selectedDate={focusedCalendarDate}
                  onSelectedDateFocused={clearCalendarSelection}
                  userId={auth.userId ?? undefined}
                />
              </div>
            )}
          />
          <JournalTimelineScrubber
            activeIndex={activeIndex}
            months={months}
            onSelectIndex={selectMonth}
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              No journals yet
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            Start writing from the Write page and your entries will appear here.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardJournals
