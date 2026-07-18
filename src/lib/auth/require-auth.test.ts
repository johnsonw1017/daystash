import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/require-auth'
import { createServerSideClient } from '@/lib/supabase/server'
import { asMockedValue, createTestUser } from '@/test/mocks/types'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedCreateServerSideClient = vi.mocked(createServerSideClient)
const mockedRedirect = vi.mocked(redirect)

const mockAuthUser = (user: ReturnType<typeof createTestUser> | null) => {
  mockedCreateServerSideClient.mockResolvedValue(asMockedValue<Awaited<ReturnType<typeof createServerSideClient>>>({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  }))
}

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current user when authenticated', async () => {
    mockAuthUser(createTestUser())

    await expect(requireAuth('/dashboard')).resolves.toMatchObject({ id: 'user-id' })
    expect(mockedRedirect).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated users to login with a safe return path', async () => {
    mockAuthUser(null)

    await requireAuth('/entries/summer trip')

    expect(mockedRedirect).toHaveBeenCalledWith(
      '/login?redirectTo=%2Fentries%2Fsummer%20trip'
    )
  })
})
