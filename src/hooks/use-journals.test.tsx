import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import {
  journalQueryKeys,
  useJournalBySlug,
  useJournalYears,
  useJournals,
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
    expect(journalQueryKeys.list('user-id')).toEqual([
      'journals',
      'list',
      'user-id',
    ])
    expect(journalQueryKeys.years('user-id')).toEqual([
      'journals',
      'years',
      'user-id',
    ])
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
  })

  it('fetches paginated journal list items with thumbnails', async () => {
    server.use(
      http.get('http://supabase.test/rest/v1/journals', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('user_id')).toBe('eq.user-id')
        expect(url.searchParams.get('limit')).toBe('13')

        return HttpResponse.json([
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
        ])
      })
    )

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
    server.use(
      http.get('http://supabase.test/rest/v1/journals', () =>
        HttpResponse.json([
          { created_at: '2026-07-17T00:00:00.000Z' },
          { created_at: '2026-01-01T00:00:00.000Z' },
          { created_at: '2025-01-01T00:00:00.000Z' },
        ])
      )
    )

    const { result } = renderHook(() => useJournalYears('user-id'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data).toEqual([2026, 2025]))
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
          created_at: '2026-07-17T00:00:00.000Z',
          updated_at: '2026-07-17T01:00:00.000Z',
          blocks: [{ id: 'text-1', type: 'text', content: 'Hello' }],
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
