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

export type ImageJournalBlock = {
  id: string
  type: 'image'
  caption: string | null
  images: JournalImageAsset[]
}

export type JournalBlock = TextJournalBlock | ImageJournalBlock

export type SaveJournalInput = {
  journalId?: string
  title: string
  blocks: JournalBlock[]
}

export type RegisterJournalAssetsInput = {
  journalId?: string
  title: string
  assets: Array<{
    publicId: string
    width: number
    height: number
    altText?: string | null
  }>
}

export type JournalSummary = {
  id: string
  title: string | null
  slug: string | null
  created_at: string
  updated_at: string
}

export type JournalListItem = JournalSummary & {
  excerpt: string
}

export type JournalDetail = JournalSummary & {
  blocks: JournalBlock[]
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

      if (block.type === 'image') {
        return normalizeImageBlock(block)
      }

      return null
    })
    .filter((block): block is JournalBlock => block !== null)
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
    .filter((block) => (block.type === 'text' ? block.content.trim().length > 0 : block.images.length > 0))

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

export const getJournalExcerpt = (blocks: JournalBlock[]) => {
  const firstTextBlock = blocks.find(
    (block): block is TextJournalBlock =>
      block.type === 'text' && block.content.trim().length > 0
  )

  return firstTextBlock?.content.trim() || 'No journal text yet.'
}

export const getReferencedAssetIds = (blocks: JournalBlock[]) =>
  new Set(
    blocks.flatMap((block) =>
      block.type === 'image' ? block.images.map((image) => image.assetId) : []
    )
  )
