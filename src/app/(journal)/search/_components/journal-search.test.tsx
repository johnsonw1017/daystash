import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JournalSearch from '@/app/(journal)/search/_components/journal-search'
import JournalSearchResult, {
  SearchExcerpt,
} from '@/app/(journal)/search/_components/journal-search-result'
import { useAuth } from '@/hooks/use-auth'
import { useJournalSearch } from '@/hooks/use-journals'
import type { JournalSearchResult as JournalSearchResultType } from '@/lib/journals'

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}))

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/use-journals', () => ({
  useJournalSearch: vi.fn(),
}))

const journal: JournalSearchResultType = {
  id: 'journal-1',
  slug: 'sunrise-hike',
  title: 'Sunrise hike',
  date: '2026-08-24',
  excerpt: 'A [[HIGHLIGHT]]hike[[/HIGHLIGHT]] before dawn',
  rank: 0.75,
  totalCount: 1,
  thumbnail: {
    publicId: 'journal/sunrise',
    width: 1200,
    height: 900,
  },
}

const mockedUseAuth = vi.mocked(useAuth)
const mockedUseJournalSearch = vi.mocked(useJournalSearch)

describe('journal search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      userId: 'user-id',
      profile: null,
      error: null,
    })
    mockedUseJournalSearch.mockReturnValue({
      data: [],
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJournalSearch>)
  })

  it('focuses the field without rendering an empty results state', () => {
    render(<JournalSearch initialQuery="" />)

    expect(screen.getByRole('searchbox', { name: 'Search journals' })).toHaveFocus()
    expect(
      screen.queryByRole('region', { name: 'Journal search results' })
    ).not.toBeInTheDocument()
  })

  it('renders results and their total count', () => {
    mockedUseJournalSearch.mockReturnValue({
      data: [journal],
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useJournalSearch>)

    render(<JournalSearch initialQuery="hike" />)

    expect(screen.getByRole('status')).toHaveTextContent('1 journal')
    expect(screen.getByRole('link', { name: /Sunrise hike/ })).toHaveAttribute(
      'href',
      '/entries/sunrise-hike'
    )
  })

  it('clears the current query', async () => {
    const user = userEvent.setup()
    render(<JournalSearch initialQuery="hike" />)

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(
      screen.queryByRole('region', { name: 'Journal search results' })
    ).not.toBeInTheDocument()
  })
})

describe('JournalSearchResult', () => {
  it('renders highlighted excerpts as safe mark elements', () => {
    render(<JournalSearchResult journal={journal} />)

    expect(screen.getByText('hike').tagName).toBe('MARK')
    expect(screen.getByRole('presentation')).toHaveAttribute(
      'src',
      'journal/sunrise'
    )
  })

  it('leaves malformed highlight markers as text', () => {
    render(<SearchExcerpt excerpt="Before [[HIGHLIGHT]]unfinished" />)

    expect(screen.getByText('Before [[HIGHLIGHT]]unfinished')).toBeInTheDocument()
    expect(document.querySelector('mark')).not.toBeInTheDocument()
  })
})
