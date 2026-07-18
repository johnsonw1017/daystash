import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/journals/discard-session/route'
import { discardJournalSessionChanges } from '@/app/(journal)/write/actions'
import { createServerSideClient } from '@/lib/supabase/server'
import { asMockedValue, createTestUser } from '@/test/mocks/types'

vi.mock('@/app/(journal)/write/actions', () => ({
  discardJournalSessionChanges: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSideClient: vi.fn(),
}))

const mockedDiscardJournalSessionChanges = vi.mocked(discardJournalSessionChanges)
const mockedCreateServerSideClient = vi.mocked(createServerSideClient)

const createJsonRequest = (body: unknown) =>
  new Request('https://daystash.test/api/journals/discard-session', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const mockAuthUser = (user: ReturnType<typeof createTestUser> | null) => {
  mockedCreateServerSideClient.mockResolvedValue(asMockedValue<Awaited<ReturnType<typeof createServerSideClient>>>({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
  }))
}

describe('POST /api/journals/discard-session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('discards journal session changes for authenticated users', async () => {
    mockAuthUser(createTestUser())
    mockedDiscardJournalSessionChanges.mockResolvedValue({
      discarded: true,
      deletedJournal: false,
    })

    const response = await POST(
      createJsonRequest({
        journalId: 'journal-id',
        sessionAssetIds: ['asset-1', 42, 'asset-2'],
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ discarded: true })
    expect(mockedDiscardJournalSessionChanges).toHaveBeenCalledWith({
      journalId: 'journal-id',
      sessionAssetIds: ['asset-1', 'asset-2'],
    })
  })

  it('returns unauthorized without a user', async () => {
    mockAuthUser(null)

    const response = await POST(createJsonRequest({ journalId: 'journal-id' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('returns a bad request for invalid JSON', async () => {
    mockAuthUser(createTestUser())

    const response = await POST(
      new Request('https://daystash.test/api/journals/discard-session', {
        method: 'POST',
        body: '{bad-json',
      })
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' })
  })

  it('returns a bad request for missing journal ids', async () => {
    mockAuthUser(createTestUser())

    const response = await POST(createJsonRequest({ sessionAssetIds: [] }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid journal id' })
  })

  it('treats missing journals as already discarded', async () => {
    mockAuthUser(createTestUser())
    mockedDiscardJournalSessionChanges.mockRejectedValue(new Error('Journal not found'))

    const response = await POST(createJsonRequest({ journalId: 'missing-journal' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ discarded: true })
  })
})
