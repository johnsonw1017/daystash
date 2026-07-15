'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useJournals } from '@/hooks/use-journals'
import { cloudinaryLoader } from '@/lib/cloudinary'
import type { JournalListItem } from '@/lib/journals'

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const monthFormatter = new Intl.DateTimeFormat('en-AU', {
  month: 'long',
  year: 'numeric',
})

type JournalMonth = {
  key: string
  label: string
  journals: JournalListItem[]
}

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
      journals: [journal],
    })
  })

  return [...months.values()]
}

const JournalThumbnail = ({ journal }: { journal: JournalListItem }) => {
  if (journal.thumbnail) {
    return (
      <Image
        loader={cloudinaryLoader}
        src={journal.thumbnail.publicId}
        alt=""
        fill
        sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    )
  }

  return (
    <div className="from-primary/15 via-secondary/10 to-accent/15 relative h-full w-full overflow-hidden bg-gradient-to-br">
      <Image
        src="/daystash-leaf.svg"
        alt=""
        fill
        sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
        className="translate-x-6 translate-y-14 rotate-12 scale-125 object-contain object-right opacity-25 dark:opacity-20"
      />
    </div>
  )
}

const JournalCard = ({ journal }: { journal: JournalListItem }) => {
  const title = journal.title?.trim() || 'Untitled Journal'
  const content = (
    <Card className="group h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        <JournalThumbnail journal={journal} />
      </div>
      <CardHeader className="gap-2 p-4 sm:p-5">
        <CardDescription>{dateFormatter.format(new Date(journal.created_at))}</CardDescription>
        <CardTitle className="line-clamp-2 text-base leading-snug font-medium">
          {title}
        </CardTitle>
      </CardHeader>
    </Card>
  )

  if (!journal.slug) {
    return <div>{content}</div>
  }

  return (
    <Link
      href={`/entries/${journal.slug}`}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {content}
    </Link>
  )
}

const JournalCardSkeleton = () => (
  <Card className="gap-0 overflow-hidden py-0">
    <Skeleton className="aspect-[4/3] w-full rounded-none" />
    <CardHeader className="gap-3 p-4 sm:p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-2/5" />
    </CardHeader>
  </Card>
)

const InitialJournalSkeletons = () => (
  <div className="space-y-4" aria-label="Loading journals" aria-live="polite">
    <Skeleton className="h-7 w-36" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} style={{ animationDelay: `${index * 75}ms` }}>
          <JournalCardSkeleton />
        </div>
      ))}
    </div>
  </div>
)

const DashboardJournals = () => {
  const authUser = useAuthUser()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useJournals(authUser.user?.id)

  const journals = useMemo(
    () => data?.pages.flatMap((page) => page.journals) ?? [],
    [data]
  )
  const journalMonths = useMemo(() => groupJournalsByMonth(journals), [journals])
  const isInitialLoading = authUser.isLoading || isLoading

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your Journals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse your latest entries.
        </p>
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
      ) : journalMonths.length ? (
        <div className="space-y-10">
          {journalMonths.map((month) => (
            <section key={month.key} aria-labelledby={`month-${month.key}`}>
              <h2
                id={`month-${month.key}`}
                className="mb-4 font-serif text-2xl font-semibold tracking-tight"
              >
                {month.label}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {month.journals.map((journal) => (
                  <JournalCard key={journal.id} journal={journal} />
                ))}
              </div>
            </section>
          ))}

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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">No journals yet</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <CardDescription>
              Start writing from the Write page and your entries will appear here.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardJournals
