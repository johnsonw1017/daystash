'use client'

import type { KeyboardEvent } from 'react'
import type { TextJournalBlock } from '@/components/journal-editor/types'
import { Textarea } from '@/components/ui/textarea'

type TextBlockProps = {
  block: TextJournalBlock
  blockCount: number
  onChange: (value: string) => void
  onAddBelow: () => void
  onRemove: () => void
  textareaRef: (node: HTMLTextAreaElement | null) => void
}

const TextBlock = ({
  block,
  blockCount,
  onChange,
  onAddBelow,
  onRemove,
  textareaRef,
}: TextBlockProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Backspace' &&
      block.text_content.trim().length === 0 &&
      blockCount > 1
    ) {
      event.preventDefault()
      onRemove()
      return
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onAddBelow()
    }
  }

  return (
    <Textarea
      ref={textareaRef}
      value={block.text_content}
      onChange={(event) => onChange(event.target.value)}
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
