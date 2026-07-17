import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { useAuthUser } from '@/hooks/use-auth-user'
import { profileQueryKeys, useProfile } from '@/hooks/use-profile'
import { server } from '@/test/mocks/server'

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: vi.fn(),
}))

const mockedUseAuthUser = vi.mocked(useAuthUser)

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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defines stable profile query keys', () => {
    expect(profileQueryKeys.all).toEqual(['profiles'])
    expect(profileQueryKeys.byUserId('user-id')).toEqual([
      'profiles',
      'user-id',
    ])
  })

  it('does not fetch while there is no authenticated user', () => {
    mockedUseAuthUser.mockReturnValue({
      user: null,
      isLoggedIn: false,
      isLoading: false,
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createQueryWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches the current user profile', async () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
    server.use(
      http.get('http://supabase.test/rest/v1/profiles', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('id')).toBe('eq.user-id')

        return HttpResponse.json({
          id: 'user-id',
          updated_at: null,
          full_name: 'Jane Traveller',
          avatar_url: null,
          email: 'jane@example.com',
          role: 'user',
        })
      })
    )

    const { result } = renderHook(() => useProfile(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() =>
      expect(result.current.data?.full_name).toBe('Jane Traveller')
    )
  })

  it('surfaces profile fetch errors', async () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
    server.use(
      http.get('http://supabase.test/rest/v1/profiles', () =>
        HttpResponse.json({ message: 'profile failed' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useProfile(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() =>
      expect(result.current.error?.message).toBe('profile failed')
    )
  })
})
