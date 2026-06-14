'use client'

import type { KeyboardEvent } from 'react'
import useTextBlock from '@/components/journal-editor/hooks/use-text-block'
import type { TextJournalBlock } from '@/components/journal-editor/types'
import { Textarea } from '@/components/ui/textarea'

type TextBlockProps = {
  block: TextJournalBlock
  blockId: string
}

const TextBlock = ({ block, blockId }: TextBlockProps) => {
  const { addBelow, blockCount, remove, setTextareaRef, updateText } =
    useTextBlock(blockId)

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Backspace' &&
      block.text_content.trim().length === 0 &&
      blockCount > 1
    ) {
      event.preventDefault()
      remove()
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      addBelow()
    }
  }

  return (
    <Textarea
      ref={setTextareaRef}
      value={block.text_content}
      onChange={(event) => updateText(event.target.value)}
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
