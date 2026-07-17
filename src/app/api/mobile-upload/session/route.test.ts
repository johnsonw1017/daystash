import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/mobile-upload/session/route'
import { createMobileUploadSession } from '@/lib/mobile-upload-server'
import { createServerSideClient } from '@/lib/supabase/server'

vi.mock('@/lib/mobile-upload-server', () => ({
  createMobileUploadSession: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedCreateMobileUploadSession = vi.mocked(createMobileUploadSession)
const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const uuid = '4dc49547-1392-49f2-ad94-163be51b6762'

const createJsonRequest = (body: unknown) =>
  new Request('https://daystash.test/api/mobile-upload/session', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const mockAuthUser = (user: { id: string } | null, error: { message: string } | null = null) => {
  mockedCreateServerSideClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
  })
}

describe('POST /api/mobile-upload/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a mobile upload session for the authenticated user', async () => {
    mockAuthUser({ id: 'user-id' })
    mockedCreateMobileUploadSession.mockResolvedValue({
      editor_session_id: uuid,
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: uuid,
      token: 'session-token',
      user_id: 'user-id',
    })

    const response = await POST(
      createJsonRequest({
        editorSessionId: uuid,
        insertAfterBlockClientId: uuid,
      })
    )

    await expect(response.json()).resolves.toEqual({
      expiresAt: '2026-07-17T00:30:00.000Z',
      token: 'session-token',
    })
    expect(response.status).toBe(200)
    expect(mockedCreateMobileUploadSession).toHaveBeenCalledWith({
      editorSessionId: uuid,
      insertAfterBlockClientId: uuid,
      userId: 'user-id',
    })
  })

  it('returns unauthorized when there is no authenticated user', async () => {
    mockAuthUser(null)

    const response = await POST(
      createJsonRequest({
        editorSessionId: uuid,
        insertAfterBlockClientId: uuid,
      })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('returns a bad request for invalid payloads', async () => {
    mockAuthUser({ id: 'user-id' })

    const response = await POST(
      createJsonRequest({
        editorSessionId: 'not-a-uuid',
        insertAfterBlockClientId: uuid,
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' })
  })

  it('returns session creation errors', async () => {
    mockAuthUser({ id: 'user-id' })
    mockedCreateMobileUploadSession.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(
      createJsonRequest({
        editorSessionId: uuid,
        insertAfterBlockClientId: uuid,
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'database unavailable' })
  })
})
