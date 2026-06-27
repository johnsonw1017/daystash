'use client'

import { useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import type { TextJournalBlock } from '@/components/journal-editor/types'
import { Textarea } from '@/components/ui/textarea'

type TextBlockProps = {
  block: TextJournalBlock
  blockId: string
}

const TextBlock = ({ block, blockId }: TextBlockProps) => {
  const {
    blocks,
    focusTextBlock,
    mergeTextBlock,
    removeBlock,
    setTextareaRef: registerTextareaRef,
    splitTextBlock,
    updateTextBlock,
  } = useJournalEditor()
  const blockCount = blocks.length

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      registerTextareaRef(blockId, node)
    },
    [blockId, registerTextareaRef]
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd, value } = event.currentTarget
    const blockIndex = blocks.findIndex((candidate) => candidate.id === blockId)
    const previousBlock = blockIndex > 0 ? blocks[blockIndex - 1] : undefined
    const nextBlock = blockIndex >= 0 ? blocks[blockIndex + 1] : undefined
    const previousTextBlock = previousBlock?.type === 'text' ? previousBlock : null
    const nextTextBlock = nextBlock?.type === 'text' ? nextBlock : null
    const hasCollapsedSelection = selectionStart === selectionEnd
    const isAtStart = selectionStart === 0
    const isAtEnd = selectionStart === value.length
    const isEmptyBlock = block.content.trim().length === 0

    if (event.key === 'Backspace' && hasCollapsedSelection && isAtStart && previousTextBlock) {
      event.preventDefault()
      focusTextBlock(previousTextBlock.id, previousTextBlock.content.length)
      mergeTextBlock(blockId, 'previous')
      return
    }

    if (event.key === 'Backspace' && isEmptyBlock && blockCount > 1) {
      event.preventDefault()
      removeBlock(blockId)
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      splitTextBlock(blockId, selectionStart, selectionEnd)
      return
    }

    if (event.key === 'Delete') {
      if (!hasCollapsedSelection || !isAtEnd || !nextTextBlock) {
        return
      }

      event.preventDefault()
      focusTextBlock(blockId, selectionStart)
      mergeTextBlock(blockId, 'next')
    }
  }

  return (
    <Textarea
      ref={setTextareaRef}
      value={block.content}
      onChange={(event) => updateTextBlock(blockId, event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={
        blockCount === 1 && block.content.trim().length === 0
          ? 'Start writing...'
          : undefined
      }
      className="placeholder:text-muted-foreground min-h-0 resize-none border-0 bg-transparent px-0 py-0 font-serif text-xl! leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
    />
  )
}

export default TextBlock
