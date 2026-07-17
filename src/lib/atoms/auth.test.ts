import { createStore } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authUserAtom,
  createAuthUserState,
  setAuthUserAtom,
} from '@/lib/atoms/auth'
import supabase from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  default: {
    auth: {
      getUser: vi.fn(),
    },
  },
}))

const mockedGetUser = vi.mocked(supabase.auth.getUser)

describe('auth atoms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates logged-out and logged-in auth user states', () => {
    expect(createAuthUserState(null, true)).toEqual({
      user: null,
      isLoggedIn: false,
      isLoading: true,
    })

    expect(createAuthUserState({ id: 'user-id' })).toEqual({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
  })

  it('refreshes the auth user atom from Supabase', async () => {
    mockedGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-id' },
      },
    })
    const store = createStore()

    await store.set(setAuthUserAtom)

    expect(store.get(authUserAtom)).toEqual({
      user: { id: 'user-id' },
      isLoggedIn: true,
      isLoading: false,
    })
  })
})
