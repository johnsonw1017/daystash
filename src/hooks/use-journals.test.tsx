import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import {
  journalQueryKeys,
  useJournalBySlug,
  useJournalMonth,
  useJournalTimelineMonths,
} from '@/hooks/use-journals'
import supabase from '@/lib/supabase/client'
import { server } from '@/test/mocks/server'

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

const setAuthenticatedSession = () => {
  return supabase.auth.setSession({
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQwNzA5MDg4MDB9.c2lnbmF0dXJl',
    refresh_token: 'test-refresh-token',
  })
}

describe('journal hooks', () => {
  it('defines stable journal query keys', () => {
    expect(journalQueryKeys.all).toEqual(['journals'])
    expect(journalQueryKeys.month('user-id', '2026-07-01')).toEqual([
      'journals',
      'month',
      'user-id',
      '2026-07-01',
    ])
    expect(journalQueryKeys.timelineMonths('user-id')).toEqual([
      'journals',
      'timeline-months',
      'user-id',
    ])
    expect(journalQueryKeys.bySlug('summer-trip')).toEqual([
      'journals',
      'slug',
      'summer-trip',
    ])
  })

  it('does not fetch journal navigation data without a user id', () => {
    const month = renderHook(() => useJournalMonth(undefined, '2026-07-01'), {
      wrapper: createQueryWrapper(),
    })
    const timeline = renderHook(() => useJournalTimelineMonths(), {
      wrapper: createQueryWrapper(),
    })

    expect(month.result.current.fetchStatus).toBe('idle')
    expect(timeline.result.current.fetchStatus).toBe('idle')
  })

  it('fetches journal list items for a calendar month', async () => {
    server.use(
      http.get('http://supabase.test/rest/v1/journals', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('user_id')).toBe('eq.user-id')
        expect(url.searchParams.getAll('date')).toEqual([
          'gte.2026-07-01',
          'lte.2026-07-31',
        ])
        expect(url.searchParams.get('order')).toBe('date.desc,id.desc')
        expect(url.searchParams.get('select')).toContain('date')

        return HttpResponse.json([
          {
            id: 'journal-1',
            title: 'Summer trip',
            slug: 'summer-trip',
            date: '2026-07-17',
            thumbnail: [
              {
                cloudinary_public_id: 'journal/photo',
                width: 1200,
                height: 900,
              },
            ],
            places: [{ count: 2 }],
          },
        ])
      })
    )

    const { result } = renderHook(
      () => useJournalMonth('user-id', '2026-07-01'),
      {
        wrapper: createQueryWrapper(),
      }
    )

    await waitFor(() =>
      expect(result.current.data?.[0]).toEqual({
        id: 'journal-1',
        title: 'Summer trip',
        slug: 'summer-trip',
        date: '2026-07-17',
        thumbnail: {
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
        },
        placeCount: 2,
      })
    )
  })

  it('fetches the journal timeline month counts', async () => {
    server.use(
      http.post(
        'http://supabase.test/rest/v1/rpc/get_journal_timeline_months',
        () =>
          HttpResponse.json([
            { month: '2026-07-01', journal_count: 3 },
            { month: '2026-06-01', journal_count: '2' },
          ])
      )
    )

    const { result } = renderHook(() => useJournalTimelineMonths('user-id'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() =>
      expect(result.current.data).toEqual([
        { month: '2026-07-01', journalCount: 3 },
        { month: '2026-06-01', journalCount: 2 },
      ])
    )
  })

  it('fetches a journal by slug for the current user', async () => {
    server.use(
      http.get('http://supabase.test/auth/v1/user', () =>
        HttpResponse.json({
          id: 'user-id',
          aud: 'authenticated',
          role: 'authenticated',
        })
      ),
      http.get('http://supabase.test/rest/v1/journals', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.getAll('user_id')).toEqual(['eq.user-id'])
        expect(url.searchParams.getAll('slug')).toEqual(['eq.summer-trip'])

        return HttpResponse.json({
          id: 'journal-1',
          title: 'Summer trip',
          slug: 'summer-trip',
          date: '2026-07-17',
          updated_at: '2026-07-17T01:00:00.000Z',
          blocks: [{ id: 'text-1', type: 'text', content: 'Hello' }],
          places: [],
        })
      })
    )
    const { error } = await setAuthenticatedSession()
    expect(error).toBeNull()

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
    const { result } = renderHook(() => useJournalBySlug('summer-trip'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data).toBeNull())
  })
})
