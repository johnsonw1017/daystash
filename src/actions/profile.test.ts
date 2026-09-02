import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProfile } from '@/actions/profile'
import { createServerSideClient } from '@/lib/supabase/server'
import { asMockedValue } from '@/test/mocks/types'

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createProfileClient = ({
  claimsError = null,
  updateError = null,
  userId = 'user-id',
}: {
  claimsError?: { message: string } | null
  updateError?: { message: string } | null
  userId?: string | null
} = {}) => {
  const single = vi.fn().mockResolvedValue({
    data: updateError ? null : { id: 'user-id' },
    error: updateError,
  })
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => ({ select }))
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ update }))
  const getClaims = vi.fn().mockResolvedValue({
    data: { claims: userId ? { sub: userId } : null },
    error: claimsError,
  })

  mockedCreateServerSideClient.mockResolvedValue(
    asMockedValue<Awaited<ReturnType<typeof createServerSideClient>>>({
      auth: { getClaims },
      from,
    })
  )

  return { eq, from, getClaims, update }
}

describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates only the authenticated profile', async () => {
    const client = createProfileClient()

    await expect(
      updateProfile({
        fullName: '  Jamie Traveller  ',
        avatarUrl: 'https://res.cloudinary.com/daystash/image/upload/avatar',
      })
    ).resolves.toEqual({ success: true })

    expect(client.from).toHaveBeenCalledWith('profiles')
    expect(client.update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Jamie Traveller',
        avatar_url: 'https://res.cloudinary.com/daystash/image/upload/avatar',
        updated_at: expect.any(String),
      })
    )
    expect(client.eq).toHaveBeenCalledWith('id', 'user-id')
  })

  it('rejects invalid profile values before creating a client', async () => {
    await expect(
      updateProfile({ fullName: '  ', avatarUrl: null })
    ).resolves.toEqual({
      error: 'Please enter a valid name and avatar.',
    })

    expect(mockedCreateServerSideClient).not.toHaveBeenCalled()
  })

  it('requires an authenticated user', async () => {
    createProfileClient({ userId: null })

    await expect(
      updateProfile({ fullName: 'Jamie Doe', avatarUrl: null })
    ).resolves.toEqual({
      error: 'Please log in again to update your profile.',
    })
  })

  it('returns database errors', async () => {
    createProfileClient({ updateError: { message: 'Update denied' } })

    await expect(
      updateProfile({ fullName: 'Jamie Doe', avatarUrl: null })
    ).resolves.toEqual({ error: 'Update denied' })
  })
})
