import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthUser } from '@/hooks/use-auth-user'
import { profileQueryKeys, useProfile } from '@/hooks/use-profile'
import supabase from '@/lib/supabase/client'

vi.mock('@/hooks/use-auth-user', () => ({
  useAuthUser: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  default: {
    from: vi.fn(),
  },
}))

const mockedUseAuthUser = vi.mocked(useAuthUser)
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

const createProfileQuery = (result: unknown) => {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))

  mockedFrom.mockReturnValue({ select })

  return { eq, maybeSingle, select }
}

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defines stable profile query keys', () => {
    expect(profileQueryKeys.all).toEqual(['profiles'])
    expect(profileQueryKeys.byUserId('user-id')).toEqual(['profiles', 'user-id'])
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
    expect(mockedFrom).not.toHaveBeenCalled()
  })

  it('fetches the current user profile', async () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
    const query = createProfileQuery({
      data: {
        id: 'user-id',
        updated_at: null,
        full_name: 'Jane Traveller',
        avatar_url: null,
        email: 'jane@example.com',
        role: 'user',
      },
      error: null,
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.data?.full_name).toBe('Jane Traveller'))
    expect(mockedFrom).toHaveBeenCalledWith('profiles')
    expect(query.select).toHaveBeenCalledWith(
      'id, updated_at, full_name, avatar_url, email, role'
    )
    expect(query.eq).toHaveBeenCalledWith('id', 'user-id')
  })

  it('surfaces profile fetch errors', async () => {
    mockedUseAuthUser.mockReturnValue({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
    createProfileQuery({
      data: null,
      error: { message: 'profile failed' },
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.error?.message).toBe('profile failed'))
  })
})
