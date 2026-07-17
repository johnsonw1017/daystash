import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/mobile-upload/consume/route'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'
import { createServerSideClient } from '@/lib/supabase/server'

vi.mock('@/lib/mobile-upload-server', () => ({
  getMobileUploadSessionByToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedGetMobileUploadSessionByToken = vi.mocked(getMobileUploadSessionByToken)
const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createJsonRequest = (body: unknown) =>
  new Request('https://daystash.test/api/mobile-upload/consume', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const createQueryBuilder = (result: unknown) => {
  const builder = {
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
    update: vi.fn(() => builder),
  }

  return builder
}

const mockSupabase = ({
  queryResult = { data: [], error: null },
  user = { id: 'user-id' },
}: {
  queryResult?: unknown
  user?: { id: string } | null
} = {}) => {
  const builder = createQueryBuilder(queryResult)
  const from = vi.fn(() => builder)
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  })

  mockedCreateServerSideClient.mockResolvedValue({
    auth: { getUser },
    from,
  })

  return { builder, from, getUser }
}

describe('POST /api/mobile-upload/consume', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'))
  })

  it('consumes staged images for the token owner', async () => {
    const supabase = mockSupabase({
      queryResult: {
        data: [
          {
            id: 'image-1',
            cloudinary_public_id: 'journal/photo',
            width: 1200,
            height: 900,
            position: 0,
            created_at: '2026-07-17T00:00:00.000Z',
            consumed_at: '2026-07-17T00:00:00.000Z',
          },
        ],
        error: null,
      },
    })
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })

    const response = await POST(createJsonRequest({ token: 'session-token' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      images: [
        {
          id: 'image-1',
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
          created_at: '2026-07-17T00:00:00.000Z',
        },
      ],
    })
    expect(supabase.builder.update).toHaveBeenCalledWith({
      consumed_at: '2026-07-17T00:00:00.000Z',
    })
    expect(supabase.builder.is).toHaveBeenCalledWith('consumed_at', null)
  })

  it('returns an empty image list when nothing is staged', async () => {
    mockSupabase()
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })

    const response = await POST(createJsonRequest({ token: 'session-token' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ images: [] })
  })

  it('returns unauthorized without a user', async () => {
    mockSupabase({ user: null })

    const response = await POST(createJsonRequest({ token: 'session-token' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('returns not found for missing sessions or sessions owned by another user', async () => {
    mockSupabase()
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'another-user-id',
    })

    const response = await POST(createJsonRequest({ token: 'session-token' }))

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid or expired token',
    })
  })

  it('returns a bad request for invalid payloads', async () => {
    const response = await POST(createJsonRequest({ token: '' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' })
  })
})
