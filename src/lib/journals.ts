export type JournalImageAsset = {
  assetId: string
  publicId: string
  width: number
  height: number
  altText: string | null
}

export type TextJournalBlock = {
  id: string
  type: 'text'
  content: string
}

export type ListStyle = 'bullet' | 'numbered'

export type ListJournalBlock = {
  id: string
  type: 'list'
  style: ListStyle
  items: string[]
}

export type ImageJournalBlock = {
  id: string
  type: 'image'
  caption: string | null
  images: JournalImageAsset[]
}

export type JournalBlock = TextJournalBlock | ListJournalBlock | ImageJournalBlock

export type SaveJournalInput = {
  journalId?: string
  title: string
  blocks: JournalBlock[]
  starredImageAssetId?: string | null
}

export type RegisterJournalAssetsInput = {
  journalId?: string
  title: string
  assets: Array<{
    publicId: string
    width: number
    height: number
  }>
}

export type JournalSummary = {
  id: string
  title: string | null
  slug: string | null
  created_at: string
  updated_at: string
}

export type JournalThumbnail = {
  publicId: string
  width: number
  height: number
}

export type JournalListItem = Pick<
  JournalSummary,
  'id' | 'title' | 'slug' | 'created_at'
> & {
  thumbnail: JournalThumbnail | null
}

export type JournalDetail = JournalSummary & {
  blocks: JournalBlock[]
  starredImageAssetId: string | null
}

export type JournalContent = {
  blocks: JournalBlock[]
  starredImageAssetId: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeTextBlock = (value: Record<string, unknown>): TextJournalBlock | null => {
  const id = typeof value.id === 'string' && value.id.length > 0 ? value.id : null

  if (!id) {
    return null
  }

  return {
    id,
    type: 'text',
    content: typeof value.content === 'string' ? value.content : '',
  }
}

const normalizeListBlock = (value: Record<string, unknown>): ListJournalBlock | null => {
  const id = typeof value.id === 'string' && value.id.length > 0 ? value.id : null
  const itemsValue = Array.isArray(value.items) ? value.items : []

  if (!id) {
    return null
  }

  const items = itemsValue
    .map((item) => {
      if (typeof item === 'string') {
        return item
      }

      if (isRecord(item) && typeof item.content === 'string') {
        return item.content
      }

      return null
    })
    .filter((item): item is string => item !== null)

  if (!items.length) {
    return null
  }

  return {
    id,
    type: 'list',
    style: value.style === 'numbered' ? 'numbered' : 'bullet',
    items,
  }
}

const normalizeImageAsset = (value: Record<string, unknown>): JournalImageAsset | null => {
  const assetId =
    typeof value.assetId === 'string' && value.assetId.length > 0 ? value.assetId : null
  const publicId =
    typeof value.publicId === 'string' && value.publicId.length > 0 ? value.publicId : null
  const width = typeof value.width === 'number' ? value.width : null
  const height = typeof value.height === 'number' ? value.height : null

  if (!assetId || !publicId || !width || !height) {
    return null
  }

  return {
    assetId,
    publicId,
    width,
    height,
    altText: typeof value.altText === 'string' ? value.altText.trim() || null : null,
  }
}

const normalizeImageBlock = (value: Record<string, unknown>): ImageJournalBlock | null => {
  const id = typeof value.id === 'string' && value.id.length > 0 ? value.id : null
  const imagesValue = Array.isArray(value.images) ? value.images : []

  if (!id) {
    return null
  }

  const images = imagesValue
    .filter(isRecord)
    .map(normalizeImageAsset)
    .filter((image): image is JournalImageAsset => image !== null)

  if (!images.length) {
    return null
  }

  return {
    id,
    type: 'image',
    caption: typeof value.caption === 'string' ? value.caption.trim() || null : null,
    images,
  }
}

export const parseJournalBlocks = (value: unknown): JournalBlock[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((block) => {
      if (block.type === 'text') {
        return normalizeTextBlock(block)
      }

      if (block.type === 'list') {
        return normalizeListBlock(block)
      }

      if (block.type === 'image') {
        return normalizeImageBlock(block)
      }

      return null
    })
    .filter((block): block is JournalBlock => block !== null)
}

export const parseJournalContent = (value: unknown): JournalContent => {
  if (Array.isArray(value)) {
    return { blocks: parseJournalBlocks(value), starredImageAssetId: null }
  }

  if (!isRecord(value)) {
    return { blocks: [], starredImageAssetId: null }
  }

  return {
    blocks: parseJournalBlocks(value.blocks),
    starredImageAssetId:
      typeof value.starredImageAssetId === 'string' && value.starredImageAssetId.length > 0
        ? value.starredImageAssetId
        : null,
  }
}

export const normalizeJournalBlocks = (blocks: JournalBlock[]): JournalBlock[] => {
  const normalized = blocks
    .map((block) => {
      if (block.type === 'text') {
        return {
          id: block.id,
          type: 'text' as const,
          content: block.content,
        }
      }

      if (block.type === 'list') {
        const items = block.items
          .map((item) => item)
          .filter((item) => item.trim().length > 0)

        return {
          id: block.id,
          type: 'list' as const,
          style: block.style,
          items,
        }
      }

      return {
        id: block.id,
        type: 'image' as const,
        caption: block.caption?.trim() || null,
        images: block.images
          .map((image) => ({
            assetId: image.assetId,
            publicId: image.publicId,
            width: image.width,
            height: image.height,
            altText: image.altText?.trim() || null,
          }))
          .filter((image) => image.publicId.length > 0),
      }
    })
    .filter((block) => {
      if (block.type === 'text') {
        return block.content.trim().length > 0
      }

      if (block.type === 'list') {
        return block.items.length > 0
      }

      return block.images.length > 0
    })

  if (!normalized.length) {
    return [
      {
        id: crypto.randomUUID(),
        type: 'text',
        content: '',
      },
    ]
  }

  return normalized
}

export const getReferencedAssetIds = (blocks: JournalBlock[]) =>
  new Set(
    blocks.flatMap((block) =>
      block.type === 'image' ? block.images.map((image) => image.assetId) : []
    )
  )

export const getJournalThumbnailAssetId = (
  blocks: JournalBlock[],
  starredImageAssetId: string | null = null
) => {
  if (starredImageAssetId) return starredImageAssetId

  const firstImageBlock = blocks.find(
    (block): block is ImageJournalBlock =>
      block.type === 'image' && block.images.length > 0
  )

  return firstImageBlock?.images[0]?.assetId ?? null
}
