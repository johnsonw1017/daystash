import { v4 as uuidv4 } from 'uuid'
import type { JournalBlock, JournalBlockImage } from '@/lib/journals'

type NewJournalBlockImage = Pick<
  JournalBlockImage,
  'cloudinary_public_id' | 'width' | 'height'
> & {
  id?: string
  block_id?: string
  alt_text?: string | null
}

export const makeTextBlock = (text = ''): JournalBlock => ({
  id: uuidv4(),
  type: 'text',
  position: 0,
  text_content: text,
})

export const makeImageBlock = (images: NewJournalBlockImage[]): JournalBlock => ({
  id: uuidv4(),
  type: 'image',
  position: 0,
  caption: '',
  images: images.map((image, imageIndex) => ({
    ...image,
    position: imageIndex,
    alt_text: image.alt_text ?? null,
  })),
})

export const normalizeEditorBlocks = (blocks: JournalBlock[]) => {
  const filtered = blocks
    .map((block, index) => {
      if (block.type === 'text') {
        return {
          ...block,
          id: block.id ?? uuidv4(),
          position: index,
        }
      }

      return {
        ...block,
        id: block.id ?? uuidv4(),
        position: index,
        images: block.images.map((image, imageIndex) => ({
          ...image,
          position: imageIndex,
        })),
      }
    })
    .filter((block) => (block.type === 'text' ? true : block.images.length > 0))

  return filtered.length ? filtered : [makeTextBlock()]
}

export const reindexBlocks = (blocks: JournalBlock[]) =>
  blocks.map((block, index) => ({ ...block, position: index }))
