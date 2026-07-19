import { describe, expect, it, vi } from 'vitest'
import {
  getJournalThumbnailAssetId,
  getReferencedAssetIds,
  normalizeJournalBlocks,
  parseJournalBlocks,
  type JournalBlock,
} from '@/lib/journals'

describe('parseJournalBlocks', () => {
  it('normalizes valid persisted block data and skips invalid blocks', () => {
    expect(
      parseJournalBlocks([
        null,
        { id: '', type: 'text', content: 'missing id' },
        { id: 'text-1', type: 'text', content: 'A quiet morning' },
        {
          id: 'list-1',
          type: 'list',
          style: 'numbered',
          items: ['Coffee', { content: 'Train tickets' }, { label: 'ignored' }],
        },
        {
          id: 'image-1',
          type: 'image',
          caption: '  Mountain view  ',
          images: [
            {
              assetId: 'asset-1',
              publicId: 'trips/day-1',
              width: 1200,
              height: 900,
              altText: '  sunrise  ',
            },
            { assetId: '', publicId: 'bad', width: 1, height: 1 },
          ],
        },
        { id: 'unknown-1', type: 'quote', content: 'ignored' },
      ])
    ).toEqual([
      { id: 'text-1', type: 'text', content: 'A quiet morning' },
      {
        id: 'list-1',
        type: 'list',
        style: 'numbered',
        items: ['Coffee', 'Train tickets'],
      },
      {
        id: 'image-1',
        type: 'image',
        caption: 'Mountain view',
        images: [
          {
            assetId: 'asset-1',
            publicId: 'trips/day-1',
            width: 1200,
            height: 900,
            altText: 'sunrise',
          },
        ],
      },
    ])
  })

  it('returns an empty array for non-array data', () => {
    expect(parseJournalBlocks({ type: 'text' })).toEqual([])
  })
})

describe('normalizeJournalBlocks', () => {
  it('removes empty content and trims image metadata', () => {
    const blocks: JournalBlock[] = [
      { id: 'empty-text', type: 'text', content: '   ' },
      { id: 'text-1', type: 'text', content: 'Packed the bags' },
      {
        id: 'list-1',
        type: 'list',
        style: 'bullet',
        items: ['Camera', '   ', 'Passport'],
      },
      {
        id: 'image-1',
        type: 'image',
        caption: '  Airport lounge  ',
        images: [
          {
            assetId: 'asset-1',
            publicId: 'travel/airport',
            width: 1600,
            height: 1200,
            altText: '  waiting area  ',
          },
          {
            assetId: 'asset-2',
            publicId: '',
            width: 1,
            height: 1,
            altText: null,
          },
        ],
      },
    ]

    expect(normalizeJournalBlocks(blocks)).toEqual([
      { id: 'text-1', type: 'text', content: 'Packed the bags' },
      {
        id: 'list-1',
        type: 'list',
        style: 'bullet',
        items: ['Camera', 'Passport'],
      },
      {
        id: 'image-1',
        type: 'image',
        caption: 'Airport lounge',
        images: [
          {
            assetId: 'asset-1',
            publicId: 'travel/airport',
            width: 1600,
            height: 1200,
            altText: 'waiting area',
          },
        ],
      },
    ])
  })

  it('creates a blank text block when all blocks are empty', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('new-block-id')

    expect(normalizeJournalBlocks([{ id: 'empty', type: 'text', content: '' }])).toEqual([
      { id: 'new-block-id', type: 'text', content: '' },
    ])
  })
})

describe('journal asset helpers', () => {
  const blocks: JournalBlock[] = [
    { id: 'text-1', type: 'text', content: 'No images here' },
    {
      id: 'image-1',
      type: 'image',
      caption: null,
      images: [
        {
          assetId: 'asset-1',
          publicId: 'first',
          width: 100,
          height: 100,
          altText: null,
        },
        {
          assetId: 'asset-2',
          publicId: 'second',
          width: 100,
          height: 100,
          altText: null,
        },
      ],
    },
  ]

  it('collects referenced asset ids', () => {
    expect(getReferencedAssetIds(blocks)).toEqual(new Set(['asset-1', 'asset-2']))
  })

  it('returns the first image asset as the journal thumbnail', () => {
    expect(getJournalThumbnailAssetId(blocks)).toBe('asset-1')
  })

  it('returns the starred image asset as the journal thumbnail', () => {
    expect(getJournalThumbnailAssetId(blocks, 'asset-2')).toBe('asset-2')
  })
})
