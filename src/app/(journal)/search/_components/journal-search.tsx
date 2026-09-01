'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import JournalLoadError from '@/components/journal-load-error'
import { useAuth } from '@/hooks/use-auth'
import { useJournalSearch } from '@/hooks/use-journals'
import JournalSearchResult from './journal-search-result'

const SEARCH_DELAY_MS = 500

const SearchResultSkeletons = () => (
  <div aria-label="Loading search results" className="divide-y border-y">
    {Array.from({ length: 3 }, (_, index) => (
      <div
        key={index}
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-3 py-4 sm:px-4"
      >
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="size-20 rounded-lg sm:size-24" />
      </div>
    ))}
  </div>
)

const JournalSearch = ({ initialQuery }: { initialQuery: string }) => {
  const auth = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const initialValue = initialQuery.slice(0, 200)
  const [query, setQuery] = useState(initialValue)
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue.trim())
  const normalizedQuery = debouncedQuery.trim()
  const isValidQuery = normalizedQuery.length >= 2
  const {
    data = [],
    error,
    isFetching,
    refetch,
  } = useJournalSearch(auth.userId ?? undefined, normalizedQuery)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, SEARCH_DELAY_MS)

    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const href = normalizedQuery
      ? `/search?q=${encodeURIComponent(normalizedQuery)}`
      : '/search'
    window.history.replaceState(null, '', href)
  }, [normalizedQuery])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextQuery = query.trim()
    setQuery(nextQuery)
    setDebouncedQuery(nextQuery)
  }

  const totalCount = data[0]?.totalCount ?? 0

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      </header>

      <form role="search" className="mt-6" onSubmit={submitSearch}>
        <InputGroup className="bg-card h-12 rounded-xl">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type="search"
            aria-label="Search journals"
            placeholder="Search..."
            value={query}
            maxLength={200}
            enterKeyHint="search"
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      </form>

      {normalizedQuery && (
        <section aria-label="Journal search results" className="mt-8">
          {!isValidQuery ? (
            <p className="text-muted-foreground text-sm" role="status">
              Enter at least two characters to search.
            </p>
          ) : auth.isLoading || (isFetching && !data.length) ? (
            <SearchResultSkeletons />
          ) : error ? (
            <JournalLoadError
              title="Search results could not be loaded"
              onRetry={() => void refetch()}
            />
          ) : data.length ? (
            <>
              <p className="text-muted-foreground mb-3 text-sm" role="status">
                {totalCount === 1 ? '1 journal' : `${totalCount} journals`}
                {totalCount > data.length &&
                  ` · Showing the best ${data.length}`}
              </p>
              <ul className="divide-y border-y">
                {data.map((journal) => (
                  <JournalSearchResult key={journal.id} journal={journal} />
                ))}
              </ul>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  No journals found
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground pb-6 text-sm">
                Try fewer words or a different phrase.
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </main>
  )
}

export default JournalSearch
