import { v4 as uuidv4 } from 'uuid'
import {
  normalizeJournalBlocks,
  type ImageJournalBlock,
  type JournalBlock,
  type JournalImageAsset,
  type TextJournalBlock,
} from '@/lib/journals'

type NewJournalImageAsset = Pick<
  JournalImageAsset,
  'assetId' | 'publicId' | 'width' | 'height'
> & {
  altText?: string | null
}

export const makeTextBlock = (content = ''): TextJournalBlock => ({
  id: uuidv4(),
  type: 'text',
  content,
})

export const makeImageBlock = (
  images: NewJournalImageAsset[]
): ImageJournalBlock => ({
  id: uuidv4(),
  type: 'image',
  caption: '',
  images: images.map((image) => ({
    ...image,
    altText: image.altText ?? null,
  })),
})

export const normalizeEditorBlocks = (blocks: JournalBlock[]) =>
  normalizeJournalBlocks(blocks)
