import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/mobile-upload/complete/route'
import { getMobileUploadSessionByToken } from '@/lib/mobile-upload-server'
import { createAdminClient } from '@/lib/supabase/server'

vi.mock('@/lib/mobile-upload-server', () => ({
  getMobileUploadSessionByToken: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

const mockedGetMobileUploadSessionByToken = vi.mocked(getMobileUploadSessionByToken)
const mockedCreateAdminClient = vi.mocked(createAdminClient)

const createJsonRequest = (body: unknown) =>
  new Request('https://daystash.test/api/mobile-upload/complete', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const createQueryBuilder = (result: unknown) => {
  const builder = {
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue(result),
    order: vi.fn(() => builder),
    select: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }

  return builder
}

const createAdminClientMock = (results: unknown[]) => {
  const builders = results.map(createQueryBuilder)
  const from = vi.fn(() => {
    const builder = builders.shift()

    if (!builder) {
      throw new Error('Unexpected Supabase query')
    }

    return builder
  })

  mockedCreateAdminClient.mockReturnValue({ from })

  return { from }
}

describe('POST /api/mobile-upload/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stages an uploaded image at the next position', async () => {
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })
    const admin = createAdminClientMock([
      { data: { position: 2 }, error: null },
      { data: null, error: null },
    ])

    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        image: {
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
        },
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(mockedGetMobileUploadSessionByToken).toHaveBeenCalledWith('session-token', {
      useAdminClient: true,
    })
    expect(admin.from.mock.results[1].value.insert).toHaveBeenCalledWith({
      session_id: 'session-id',
      cloudinary_public_id: 'journal/photo',
      width: 1200,
      height: 900,
      position: 3,
    })
  })

  it('starts image positions at zero', async () => {
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })
    const admin = createAdminClientMock([
      { data: null, error: null },
      { data: null, error: null },
    ])

    await POST(
      createJsonRequest({
        token: 'session-token',
        image: {
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
        },
      })
    )

    expect(admin.from.mock.results[1].value.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 0 })
    )
  })

  it('returns a bad request for invalid payloads', async () => {
    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        image: { publicId: '', width: 1200, height: 900 },
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' })
  })

  it('returns not found for invalid or expired tokens', async () => {
    mockedGetMobileUploadSessionByToken.mockResolvedValue(null)

    const response = await POST(
      createJsonRequest({
        token: 'expired-token',
        image: {
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
        },
      })
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid or expired token',
    })
  })

  it('returns staging errors', async () => {
    mockedGetMobileUploadSessionByToken.mockResolvedValue({
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    })
    createAdminClientMock([{ data: null, error: { message: 'read failed' } }])

    const response = await POST(
      createJsonRequest({
        token: 'session-token',
        image: {
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
        },
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'read failed' })
  })
})
