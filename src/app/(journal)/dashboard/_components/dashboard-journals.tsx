'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { SquarePen } from 'lucide-react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useJournalTimelineMonths } from '@/hooks/use-journals'
import { InitialJournalSkeletons } from './journal-skeletons'
import JournalTimelineScrubber from './journal-timeline-scrubber'
import VirtualizedJournalMonth from './virtualized-journal-month'

const DashboardJournals = () => {
  const authUser = useAuthUser()
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const {
    data: months = [],
    error,
    isLoading,
    refetch,
  } = useJournalTimelineMonths(authUser.user?.id)
  const isInitialLoading = authUser.isLoading || isLoading

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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Stash</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Browse your journals by month and year.
          </p>
        </div>
        <div className="hidden lg:block">
          <Button variant="accent" asChild>
            <Link href="/write">
              <SquarePen />
              Write
            </Link>
          </Button>
        </div>
      </div>

      {isInitialLoading ? (
        <InitialJournalSkeletons />
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Journals could not be loaded
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
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
                  userId={authUser.user?.id}
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
            <CardTitle className="text-base font-medium">No journals yet</CardTitle>
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
