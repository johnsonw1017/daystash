import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteJournal,
  discardJournalSessionChanges,
  registerJournalAssets,
  saveJournal,
} from '@/app/(journal)/write/actions'
import { requireAuth } from '@/lib/auth/require-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { asMockedValue, createTestUser } from '@/test/mocks/types'

vi.mock('@/lib/auth/require-auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

const mockedRequireAuth = vi.mocked(requireAuth)
const mockedCreateAdminClient = vi.mocked(createAdminClient)

const createQueryBuilder = (result: unknown) => {
  const builder = {
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    maybeSingle: vi.fn().mockResolvedValue(result),
    select: vi.fn(() => builder),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
    update: vi.fn(() => builder),
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

  mockedCreateAdminClient.mockReturnValue(
    asMockedValue<ReturnType<typeof createAdminClient>>({ from })
  )

  return { builders, from }
}

describe('journal write actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('asset-id')
    mockedRequireAuth.mockResolvedValue(createTestUser())
  })

  it('registers assets against a newly created journal', async () => {
    const admin = createAdminClientMock([
      { data: { id: 'journal-id' }, error: null },
      {
        data: [
          {
            id: 'asset-id',
            cloudinary_public_id: 'journal/photo',
            width: 1200,
            height: 900,
          },
        ],
        error: null,
      },
    ])

    await expect(
      registerJournalAssets({
        title: '  Summer trip  ',
        assets: [{ publicId: 'journal/photo', width: 1200, height: 900 }],
      })
    ).resolves.toEqual({
      journalId: 'journal-id',
      assets: [
        {
          assetId: 'asset-id',
          publicId: 'journal/photo',
          width: 1200,
          height: 900,
          altText: null,
        },
      ],
    })

    expect(mockedRequireAuth).toHaveBeenCalledWith('/write')
    expect(admin.from).toHaveBeenNthCalledWith(1, 'journals')
    expect(admin.from).toHaveBeenNthCalledWith(2, 'journal_assets')
    expect(admin.from.mock.results[0].value.insert).toHaveBeenCalledWith({
      user_id: 'user-id',
      title: 'Summer trip',
    })
    expect(admin.from.mock.results[1].value.insert).toHaveBeenCalledWith([
      {
        id: 'asset-id',
        journal_id: 'journal-id',
        user_id: 'user-id',
        cloudinary_public_id: 'journal/photo',
        width: 1200,
        height: 900,
      },
    ])
  })

  it('saves a journal, removes orphaned assets, and sets a valid thumbnail', async () => {
    const admin = createAdminClientMock([
      { data: { id: 'journal-id' }, error: null },
      {
        data: [
          {
            id: 'asset-1',
            cloudinary_public_id: 'journal/photo',
            width: 1200,
            height: 900,
          },
          {
            id: 'orphaned-asset',
            cloudinary_public_id: 'journal/old-photo',
            width: 800,
            height: 600,
          },
        ],
        error: null,
      },
      { data: null, error: null },
      { data: null, error: null },
    ])

    await expect(
      saveJournal({
        journalId: 'journal-id',
        title: '  Saved title  ',
        blocks: [
          { id: 'empty', type: 'text', content: '   ' },
          {
            id: 'image-1',
            type: 'image',
            caption: '  View  ',
            images: [
              {
                assetId: 'asset-1',
                publicId: 'journal/photo',
                width: 1200,
                height: 900,
                altText: '  Mountain  ',
              },
            ],
          },
        ],
      })
    ).resolves.toMatchObject({
      journalId: 'journal-id',
      blocks: [
        {
          id: 'image-1',
          type: 'image',
          caption: 'View',
          images: [
            {
              assetId: 'asset-1',
              publicId: 'journal/photo',
              width: 1200,
              height: 900,
              altText: 'Mountain',
            },
          ],
        },
      ],
    })

    const deleteBuilder = admin.from.mock.results[2].value
    const updateBuilder = admin.from.mock.results[3].value

    expect(deleteBuilder.in).toHaveBeenCalledWith('id', ['orphaned-asset'])
    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Saved title',
        thumbnail_asset_id: 'asset-1',
        draft_blocks: null,
        has_unsaved_draft: false,
      })
    )
  })

  it('persists a selected non-first image as the thumbnail', async () => {
    const admin = createAdminClientMock([
      { data: { id: 'journal-id' }, error: null },
      {
        data: [
          {
            id: 'asset-1',
            cloudinary_public_id: 'journal/first',
            width: 1200,
            height: 900,
          },
          {
            id: 'asset-2',
            cloudinary_public_id: 'journal/second',
            width: 1200,
            height: 900,
          },
        ],
        error: null,
      },
      { data: null, error: null },
    ])

    await expect(
      saveJournal({
        journalId: 'journal-id',
        title: 'Saved title',
        thumbnailAssetId: 'asset-2',
        blocks: [
          {
            id: 'image-1',
            type: 'image',
            caption: null,
            images: [
              {
                assetId: 'asset-1',
                publicId: 'journal/first',
                width: 1200,
                height: 900,
                altText: null,
              },
              {
                assetId: 'asset-2',
                publicId: 'journal/second',
                width: 1200,
                height: 900,
                altText: null,
              },
            ],
          },
        ],
      })
    ).resolves.toMatchObject({ thumbnailAssetId: 'asset-2' })

    expect(admin.from.mock.results[2].value.update).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnail_asset_id: 'asset-2' })
    )
  })

  it('discards an unsaved empty journal by deleting its assets and record', async () => {
    const admin = createAdminClientMock([
      { data: { id: 'journal-id', blocks: [] }, error: null },
      {
        data: [
          {
            id: 'asset-1',
            cloudinary_public_id: 'journal/photo',
            width: 1200,
            height: 900,
          },
        ],
        error: null,
      },
      { data: null, error: null },
      { data: null, error: null },
    ])

    await expect(
      discardJournalSessionChanges({
        journalId: 'journal-id',
        sessionAssetIds: ['asset-1'],
      })
    ).resolves.toEqual({ discarded: true, deletedJournal: true })

    expect(admin.from.mock.results[2].value.in).toHaveBeenCalledWith('id', ['asset-1'])
    expect(admin.from.mock.results[3].value.delete).toHaveBeenCalledOnce()
  })

  it('deletes journals owned by the current user', async () => {
    const admin = createAdminClientMock([
      { data: { id: 'journal-id' }, error: null },
      { data: null, error: null },
    ])

    await expect(deleteJournal({ journalId: 'journal-id' })).resolves.toEqual({
      deleted: true,
    })

    expect(mockedRequireAuth).toHaveBeenCalledWith('/dashboard')
    expect(admin.from.mock.results[1].value.delete).toHaveBeenCalledOnce()
    expect(admin.from.mock.results[1].value.eq).toHaveBeenCalledWith('user_id', 'user-id')
  })

  it('throws when an existing journal is not owned by the current user', async () => {
    createAdminClientMock([{ data: null, error: null }])

    await expect(
      saveJournal({
        journalId: 'missing-journal',
        title: 'Nope',
        blocks: [{ id: 'text-1', type: 'text', content: 'No access' }],
      })
    ).rejects.toThrow('Journal not found')
  })
})
