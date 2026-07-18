import { render, waitFor } from '@testing-library/react'
import { useSetAtom } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthStateSync from '@/components/auth/auth-state-sync'
import supabase from '@/lib/supabase/client'
import { asMockedValue } from '@/test/mocks/types'

vi.mock('jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jotai')>()

  return {
    ...actual,
    useSetAtom: vi.fn(),
  }
})

vi.mock('@/lib/supabase/client', () => ({
  default: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}))

const mockedUseSetAtom = vi.mocked(useSetAtom)
const mockedOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange)

describe('AuthStateSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refreshes auth state on mount and auth changes', async () => {
    const refreshAuthUser = vi.fn()
    const unsubscribe = vi.fn()
    let authChangeCallback: Parameters<typeof supabase.auth.onAuthStateChange>[0] = vi.fn()

    mockedUseSetAtom.mockReturnValue(asMockedValue<ReturnType<typeof useSetAtom>>(refreshAuthUser))
    mockedOnAuthStateChange.mockImplementation((callback) => {
      authChangeCallback = callback

      return asMockedValue<ReturnType<typeof supabase.auth.onAuthStateChange>>({
        data: {
          subscription: { unsubscribe },
        },
      })
    })

    render(<AuthStateSync />)

    await waitFor(() => expect(refreshAuthUser).toHaveBeenCalledOnce())

    authChangeCallback('SIGNED_IN', null)

    expect(refreshAuthUser).toHaveBeenCalledTimes(2)
  })

  it('unsubscribes from auth state changes on unmount', () => {
    const refreshAuthUser = vi.fn()
    const unsubscribe = vi.fn()

    mockedUseSetAtom.mockReturnValue(asMockedValue<ReturnType<typeof useSetAtom>>(refreshAuthUser))
    mockedOnAuthStateChange.mockReturnValue(asMockedValue<ReturnType<typeof supabase.auth.onAuthStateChange>>({
      data: {
        subscription: { unsubscribe },
      },
    }))

    const { unmount } = render(<AuthStateSync />)
    unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
