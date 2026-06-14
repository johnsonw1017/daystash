'use client'

import ImageBlock from '@/components/journal-editor/blocks/image-block'
import TextBlock from '@/components/journal-editor/blocks/text-block'
import type { ResolveBlockProps } from '@/components/journal-editor/types'

const ResolveBlock = ({ block, blockId }: ResolveBlockProps) => {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} blockId={blockId} />
    case 'image':
      return <ImageBlock block={block} blockId={blockId} />
    default:
      return null
  }
}

export default ResolveBlock
