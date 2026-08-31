import JournalSearch from '@/app/(journal)/search/_components/journal-search'

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string
  }>
}

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const resolvedSearchParams = await searchParams

  return <JournalSearch initialQuery={resolvedSearchParams?.q ?? ''} />
}

export default SearchPage
