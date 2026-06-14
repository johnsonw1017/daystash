import { v4 as uuidv4 } from 'uuid'
import type { JournalBlock } from '@/lib/journals'

export const makeTextBlock = (text = ''): JournalBlock => ({
  id: uuidv4(),
  type: 'text',
  position: 0,
  text_content: text,
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
