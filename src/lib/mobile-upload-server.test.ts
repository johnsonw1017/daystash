import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createMobileUploadSession,
  getMobileUploadSessionByToken,
} from '@/lib/mobile-upload-server'
import {
  createAdminClient,
  createServerSideClient,
} from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
  createServerSideClient: vi.fn(),
}))

const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createSingleInsertClient = (result: unknown) => {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const from = vi.fn(() => ({ insert }))

  return {
    client: { from },
    from,
    insert,
    select,
    single,
  }
}

const createMaybeSingleSelectClient = (result: unknown) => {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return {
    client: { from },
    eq,
    from,
    maybeSingle,
    select,
  }
}

describe('mobile upload server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a mobile upload session with a generated token and expiry', async () => {
    const row = {
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:30:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    }
    const query = createSingleInsertClient({ data: row, error: null })
    mockedCreateServerSideClient.mockResolvedValue(query.client)

    await expect(
      createMobileUploadSession({
        editorSessionId: 'editor-session-id',
        insertAfterBlockClientId: 'block-id',
        userId: 'user-id',
      })
    ).resolves.toEqual(row)

    expect(query.from).toHaveBeenCalledWith('mobile_upload_sessions')
    expect(query.insert).toHaveBeenCalledWith({
      user_id: 'user-id',
      editor_session_id: 'editor-session-id',
      insert_after_block_client_id: 'block-id',
      token: expect.any(String),
      expires_at: '2026-07-17T00:30:00.000Z',
    })
  })

  it('throws when a session cannot be created', async () => {
    const query = createSingleInsertClient({
      data: null,
      error: { message: 'insert failed' },
    })
    mockedCreateServerSideClient.mockResolvedValue(query.client)

    await expect(
      createMobileUploadSession({
        editorSessionId: 'editor-session-id',
        insertAfterBlockClientId: 'block-id',
        userId: 'user-id',
      })
    ).rejects.toThrow('insert failed')
  })

  it('returns active sessions by token', async () => {
    const row = {
      editor_session_id: 'editor-session-id',
      expires_at: '2026-07-17T00:01:00.000Z',
      id: 'session-id',
      insert_after_block_client_id: 'block-id',
      token: 'session-token',
      user_id: 'user-id',
    }
    const query = createMaybeSingleSelectClient({ data: row, error: null })
    mockedCreateServerSideClient.mockResolvedValue(query.client)

    await expect(getMobileUploadSessionByToken('session-token')).resolves.toEqual(row)
    expect(query.eq).toHaveBeenCalledWith('token', 'session-token')
  })

  it('uses the admin client when requested', async () => {
    const query = createMaybeSingleSelectClient({ data: null, error: null })
    mockedCreateAdminClient.mockReturnValue(query.client)

    await expect(
      getMobileUploadSessionByToken('session-token', { useAdminClient: true })
    ).resolves.toBeNull()

    expect(mockedCreateAdminClient).toHaveBeenCalledOnce()
    expect(mockedCreateServerSideClient).not.toHaveBeenCalled()
  })

  it('returns null for missing or expired sessions', async () => {
    const missingQuery = createMaybeSingleSelectClient({ data: null, error: null })
    mockedCreateServerSideClient.mockResolvedValueOnce(missingQuery.client)

    await expect(getMobileUploadSessionByToken('missing-token')).resolves.toBeNull()

    const expiredQuery = createMaybeSingleSelectClient({
      data: {
        editor_session_id: 'editor-session-id',
        expires_at: '2026-07-16T23:59:59.000Z',
        id: 'session-id',
        insert_after_block_client_id: 'block-id',
        token: 'expired-token',
        user_id: 'user-id',
      },
      error: null,
    })
    mockedCreateServerSideClient.mockResolvedValueOnce(expiredQuery.client)

    await expect(getMobileUploadSessionByToken('expired-token')).resolves.toBeNull()
  })

  it('throws when session lookup fails', async () => {
    const query = createMaybeSingleSelectClient({
      data: null,
      error: { message: 'lookup failed' },
    })
    mockedCreateServerSideClient.mockResolvedValue(query.client)

    await expect(getMobileUploadSessionByToken('session-token')).rejects.toThrow(
      'lookup failed'
    )
  })
})
