import { createStore } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authStateAtom,
  createAuthState,
  refreshAuthStateAtom,
} from '@/lib/atoms/auth'
import supabase from '@/lib/supabase/client'
import { asMockedValue, createTestProfile } from '@/test/mocks/types'

const { maybeSingle, eq, select, from } = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return { maybeSingle, eq, select, from }
})

vi.mock('@/lib/supabase/client', () => ({
  default: {
    auth: {
      getClaims: vi.fn(),
    },
    from,
  },
}))

const mockedGetClaims = vi.mocked(supabase.auth.getClaims)

describe('auth atoms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates logged-out and logged-in auth states', () => {
    expect(createAuthState(null, null, true)).toEqual({
      userId: null,
      profile: null,
      isLoggedIn: false,
      isLoading: true,
    })

    expect(createAuthState('user-id', createTestProfile())).toEqual({
      userId: 'user-id',
      profile: createTestProfile(),
      isLoggedIn: true,
      isLoading: false,
    })
  })

  it('refreshes auth from verified claims and the matching profile', async () => {
    mockedGetClaims.mockResolvedValue(
      asMockedValue<Awaited<ReturnType<typeof supabase.auth.getClaims>>>({
        data: { claims: { sub: 'user-id' } },
        error: null,
      })
    )
    maybeSingle.mockResolvedValue({ data: createTestProfile(), error: null })
    const store = createStore()

    await store.set(refreshAuthStateAtom)

    expect(from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('id, full_name, email, avatar_url')
    expect(eq).toHaveBeenCalledWith('id', 'user-id')
    expect(store.get(authStateAtom)).toEqual({
      userId: 'user-id',
      profile: createTestProfile(),
      isLoggedIn: true,
      isLoading: false,
    })
  })

  it('does not query profiles without verified claims', async () => {
    mockedGetClaims.mockResolvedValue(
      asMockedValue<Awaited<ReturnType<typeof supabase.auth.getClaims>>>({
        data: { claims: null },
        error: new Error('No session'),
      })
    )
    const store = createStore()

    await store.set(refreshAuthStateAtom)

    expect(from).not.toHaveBeenCalled()
    expect(store.get(authStateAtom)).toEqual(createAuthState(null))
  })
})
