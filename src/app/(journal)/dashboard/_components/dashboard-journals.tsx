'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useJournals, useJournalYears } from '@/hooks/use-journals'
import type { JournalListItem } from '@/lib/journals'
import JournalMonthSection, { type JournalMonth } from './journal-month-section'
import {
  InitialJournalSkeletons,
  JournalCardSkeleton,
} from './journal-skeletons'
import YearTimeline from './year-timeline'

const monthFormatter = new Intl.DateTimeFormat('en-AU', {
  month: 'long',
})

const groupJournalsByMonth = (journals: JournalListItem[]) => {
  const months = new Map<string, JournalMonth>()

  journals.forEach((journal) => {
    const date = new Date(journal.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const existingMonth = months.get(key)

    if (existingMonth) {
      existingMonth.journals.push(journal)
      return
    }

    months.set(key, {
      key,
      label: monthFormatter.format(date),
      year: date.getFullYear(),
      journals: [journal],
    })
  })

  return [...months.values()]
}

const DashboardJournals = () => {
  const authUser = useAuthUser()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const pendingYearRef = useRef<number | null>(null)
  const [activeYear, setActiveYear] = useState<number | null>(null)
  const [yearNavigationRequest, setYearNavigationRequest] = useState(0)
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useJournals(authUser.user?.id)
  const { data: journalYears = [], isLoading: areYearsLoading } =
    useJournalYears(authUser.user?.id)

  const journals = useMemo(
    () => data?.pages.flatMap((page) => page.journals) ?? [],
    [data]
  )
  const journalMonths = useMemo(
    () => groupJournalsByMonth(journals),
    [journals]
  )
  const loadedYears = useMemo(
    () => [...new Set(journalMonths.map((month) => month.year))],
    [journalMonths]
  )
  const years = journalYears.length ? journalYears : loadedYears
  const isInitialLoading = authUser.isLoading || isLoading
  const displayedActiveYear = activeYear ?? years[0] ?? null

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || !hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px 0px' }
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const pendingYear = pendingYearRef.current

    if (pendingYear === null) return

    const yearSection = document.getElementById(`journal-year-${pendingYear}`)

    if (yearSection) {
      yearSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      pendingYearRef.current = null
      return
    }

    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
      return
    }

    if (!hasNextPage) {
      pendingYearRef.current = null
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    journalMonths,
    yearNavigationRequest,
  ])

  useEffect(() => {
    const monthSections = document.querySelectorAll<HTMLElement>(
      '[data-journal-year]'
    )

    if (!monthSections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)
        const year = Number(
          (visibleEntry?.target as HTMLElement | undefined)?.dataset.journalYear
        )

        if (Number.isFinite(year)) {
          setActiveYear(year)
        }
      },
      { rootMargin: '-15% 0px -70% 0px' }
    )

    monthSections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [journalMonths])

  const selectYear = (year: number) => {
    pendingYearRef.current = year
    setActiveYear(year)
    setYearNavigationRequest((request) => request + 1)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your Journals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse your latest entries.
        </p>
      </div>

      {isInitialLoading ? (
        <div className="grid gap-6 lg:grid-cols-[7rem_minmax(0,1fr)]">
          <YearTimeline
            activeYear={null}
            isLoading
            onSelectYear={() => undefined}
            years={[]}
          />
          <InitialJournalSkeletons />
        </div>
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
      ) : journalMonths.length ? (
        <div className="grid items-start gap-6 lg:grid-cols-[7rem_minmax(0,1fr)] lg:gap-8">
          <YearTimeline
            activeYear={displayedActiveYear}
            isLoading={areYearsLoading}
            onSelectYear={selectYear}
            years={years}
          />

          <div className="space-y-10">
            {journalMonths.map((month, index) => {
              const isFirstMonthOfYear =
                journalMonths[index - 1]?.year !== month.year

              return (
                <JournalMonthSection
                  key={month.key}
                  isFirstMonthOfYear={isFirstMonthOfYear}
                  month={month}
                />
              )
            })}

            <div ref={loadMoreRef} className="min-h-1" aria-hidden="true" />

            {isFetchingNextPage ? (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                aria-label="Loading more journals"
                aria-live="polite"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <JournalCardSkeleton key={index} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              No journals yet
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <CardDescription>
              Start writing from the Write page and your entries will appear
              here.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardJournals
