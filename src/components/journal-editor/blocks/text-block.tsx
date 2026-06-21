'use client'

import { useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
import type { TextJournalBlock } from '@/components/journal-editor/types'
import { Textarea } from '@/components/ui/textarea'

type TextBlockProps = {
  block: TextJournalBlock
  blockId: string
}

const TextBlock = ({ block, blockId }: TextBlockProps) => {
  const {
    blocks,
    insertBlockBelow,
    removeBlock,
    setTextareaRef: registerTextareaRef,
    updateTextBlock,
  } = useJournalBlocks()
  const blockCount = blocks.length

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      registerTextareaRef(blockId, node)
    },
    [blockId, registerTextareaRef]
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Backspace' &&
      block.text_content.trim().length === 0 &&
      blockCount > 1
    ) {
      event.preventDefault()
      removeBlock(blockId)
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      insertBlockBelow(blockId, 'text')
    }
  }

  return (
    <Textarea
      ref={setTextareaRef}
      value={block.text_content}
      onChange={(event) => updateTextBlock(blockId, event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={
        blockCount === 1 && block.text_content.trim().length === 0
          ? 'Start writing...'
          : undefined
      }
      className="placeholder:text-muted-foreground min-h-0 resize-none border-0 bg-transparent px-0 py-0 font-serif text-xl! leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
    />
  )
}

export default TextBlock
