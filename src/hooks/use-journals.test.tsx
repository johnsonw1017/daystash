import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  journalQueryKeys,
  useJournalBySlug,
  useJournalYears,
  useJournals,
} from '@/hooks/use-journals'
import supabase from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  default: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

const mockedGetUser = vi.mocked(supabase.auth.getUser)
const mockedFrom = vi.mocked(supabase.from)

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return QueryWrapper
}

const createQueryBuilder = (result: unknown) => {
  const builder = {
    eq: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue(result),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }

  mockedFrom.mockReturnValue(builder)

  return builder
}

describe('journal hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defines stable journal query keys', () => {
    expect(journalQueryKeys.all).toEqual(['journals'])
    expect(journalQueryKeys.list('user-id')).toEqual(['journals', 'list', 'user-id'])
    expect(journalQueryKeys.years('user-id')).toEqual(['journals', 'years', 'user-id'])
    expect(journalQueryKeys.bySlug('summer-trip')).toEqual([
      'journals',
      'slug',
      'summer-trip',
    ])
  })

  it('does not fetch journals without a user id', () => {
    const { result } = renderHook(() => useJournals(), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedFrom).not.toHaveBeenCalled()
  })

  it('fetches paginated journal list items with thumbnails', async () => {
    createQueryBuilder({
      data: [
        {
          id: 'journal-1',
          title: 'Summer trip',
          slug: 'summer-trip',
          created_at: '2026-07-17T00:00:00.000Z',
          thumbnail: [
            {
              cloudinary_public_id: 'journal/photo',
              width: 1200,
              height: 900,
            },
          ],
        },
      ],
      error: null,
    })

    const { result } = renderHook(() => useJournals('user-id'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() =>
      expect(result.current.data?.pages[0]?.journals[0]).toEqual({
        id: 'journal-1',
        title: 'Summer trip',
        slug: 'summer-trip',
        created_at: '2026-07-17T00:00:00.000Z',
        thumbnail: {
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
        },
      })
    )
  })

  it('fetches unique journal years in descending data order', async () => {
    createQueryBuilder({
      data: [
        { created_at: '2026-07-17T00:00:00.000Z' },
        { created_at: '2026-01-01T00:00:00.000Z' },
        { created_at: '2025-01-01T00:00:00.000Z' },
      ],
      error: null,
    })

    const { result } = renderHook(() => useJournalYears('user-id'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data).toEqual([2026, 2025]))
  })

  it('fetches a journal by slug for the current user', async () => {
    mockedGetUser.mockResolvedValue({
      data: { user: { id: 'user-id' } },
      error: null,
    })
    createQueryBuilder({
      data: {
        id: 'journal-1',
        title: 'Summer trip',
        slug: 'summer-trip',
        created_at: '2026-07-17T00:00:00.000Z',
        updated_at: '2026-07-17T01:00:00.000Z',
        blocks: [{ id: 'text-1', type: 'text', content: 'Hello' }],
      },
      error: null,
    })

    const { result } = renderHook(() => useJournalBySlug('summer-trip'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() =>
      expect(result.current.data).toMatchObject({
        id: 'journal-1',
        blocks: [{ id: 'text-1', type: 'text', content: 'Hello' }],
      })
    )
  })

  it('returns null for journal slug lookups without a current user', async () => {
    mockedGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const { result } = renderHook(() => useJournalBySlug('summer-trip'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeNull())
    expect(mockedFrom).not.toHaveBeenCalled()
  })
})
