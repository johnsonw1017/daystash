import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/mobile-upload/release/route'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'
import { createServerSideClient } from '@/lib/supabase/server'
import { asMockedValue, createTestUser } from '@/test/mocks/types'

vi.mock('@/lib/mobile-upload-server', () => ({
  getMobileUploadSessionByToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedGetMobileUploadSessionByToken = vi.mocked(getMobileUploadSessionByToken)
const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createJsonRequest = (body: unknown) =>
  new Request('https://daystash.test/api/mobile-upload/release', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const createQueryBuilder = (result: unknown) => {
  const builder = {
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
    update: vi.fn(() => builder),
  }

  return builder
}

const mockSupabase = ({
  queryResult = { data: null, error: null },
  user = createTestUser(),
}: {
  queryResult?: unknown
  user?: ReturnType<typeof createTestUser> | null
} = {}) => {
  const builder = createQueryBuilder(queryResult)
  const from = vi.fn(() => builder)
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  })

  mockedCreateServerSideClient.mockResolvedValue(asMockedValue<Awaited<ReturnType<typeof createServerSideClient>>>({
    auth: { getUser },
    from,
  }))

  return { builder, from, getUser }
}

describe('POST /api/mobile-upload/release', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('releases consumed staged uploads for the token owner', async () => {
    const supabase = mockSupabase()
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })

    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        imageIds: ['image-1', 'image-2'],
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ released: true })
    expect(supabase.builder.update).toHaveBeenCalledWith({ consumed_at: null })
    expect(supabase.builder.eq).toHaveBeenCalledWith('session_id', 'session-id')
    expect(supabase.builder.in).toHaveBeenCalledWith('id', ['image-1', 'image-2'])
  })

  it('returns unauthorized without a user', async () => {
    mockSupabase({ user: null })

    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        imageIds: ['image-1'],
      })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('returns not found for sessions owned by another user', async () => {
    mockSupabase()
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'another-user-id',
    })

    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        imageIds: ['image-1'],
      })
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid or expired token',
    })
  })

  it('returns a bad request for invalid payloads', async () => {
    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        imageIds: [],
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' })
  })

  it('returns release errors', async () => {
    mockSupabase({ queryResult: { data: null, error: { message: 'release failed' } } })
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })

    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        imageIds: ['image-1'],
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'release failed' })
  })
})
