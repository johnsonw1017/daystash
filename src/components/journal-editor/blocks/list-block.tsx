'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import type { ListJournalBlock } from '@/components/journal-editor/types'
import { getTextareaLineBoundaryState } from '@/components/journal-editor/utils'
import { Textarea } from '@/components/ui/textarea'

type ListBlockProps = {
  block: ListJournalBlock
  blockId: string
}

const indentWidth = 28

const ListBlock = ({ block, blockId }: ListBlockProps) => {
  const {
    convertListBlockToTextBlock,
    focusBlock,
    focusListItem,
    focusTextBlock,
    getNextBlock,
    getPreviousBlock,
    indentListItem,
    mergeListItem,
    outdentListItem,
    setBlockFocusTarget,
    splitListItem,
    updateListItem,
  } = useJournalEditor()
  const itemRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  const getBoundaryElement = useCallback(
    (placement: 'start' | 'end') => {
      const orderedIds =
        placement === 'start' ? block.items.map((item) => item.id) : [...block.items].reverse().map((item) => item.id)

      return orderedIds
        .map((itemId) => itemRefs.current[itemId] ?? null)
        .find((element): element is HTMLTextAreaElement => element !== null) ?? null
    },
    [block.items]
  )

  useEffect(() => {
    setBlockFocusTarget(blockId, {
      kind: 'list',
      getElement: getBoundaryElement,
    })

    return () => {
      setBlockFocusTarget(blockId, null)
    }
  }, [blockId, getBoundaryElement, setBlockFocusTarget])

  const setItemRef = useCallback(
    (itemId: string, node: HTMLTextAreaElement | null) => {
      itemRefs.current[itemId] = node
      setBlockFocusTarget(
        `${blockId}:${itemId}`,
        node
          ? {
              element: node,
              kind: 'textarea',
            }
          : null
      )
    },
    [blockId, setBlockFocusTarget]
  )

  return (
    <div className="space-y-1">
      {block.items.map((item, itemIndex) => {
        const previousItem = block.items[itemIndex - 1] ?? null
        const nextItem = block.items[itemIndex + 1] ?? null
        const marker = block.style === 'numbered' ? `${itemIndex + 1}.` : '\u2022'

        const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
          const { selectionStart, selectionEnd, value } = event.currentTarget
          const hasCollapsedSelection = selectionStart === selectionEnd
          const isAtStart = selectionStart === 0
          const isAtEnd = selectionStart === value.length
          const isEmptyItem = item.content.trim().length === 0

          if (event.key === 'Tab') {
            event.preventDefault()

            if (event.shiftKey) {
              outdentListItem(blockId, item.id)
            } else {
              indentListItem(blockId, item.id)
            }

            return
          }

          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()

            if (isEmptyItem) {
              const nextTextBlockId = convertListBlockToTextBlock(blockId, item.id)
              focusTextBlock(nextTextBlockId, 0)
              return
            }

            const nextItemId = splitListItem(blockId, item.id, selectionStart, selectionEnd)
            focusListItem(blockId, nextItemId, 0)
            return
          }

          if (event.key === 'Backspace' && hasCollapsedSelection && isAtStart) {
            if (item.indent > 0) {
              event.preventDefault()
              outdentListItem(blockId, item.id)
              return
            }

            if (previousItem) {
              event.preventDefault()
              focusListItem(blockId, previousItem.id, previousItem.content.length)
              mergeListItem(blockId, item.id, 'previous')
              return
            }

            if (isEmptyItem) {
              event.preventDefault()
              const nextTextBlockId = convertListBlockToTextBlock(blockId, item.id)
              focusTextBlock(nextTextBlockId, 0)
            }

            return
          }

          if (event.key === 'Delete' && hasCollapsedSelection && isAtEnd && nextItem) {
            event.preventDefault()
            focusListItem(blockId, item.id, selectionStart)
            mergeListItem(blockId, item.id, 'next')
            return
          }

          if (
            hasCollapsedSelection &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
          ) {
            const { isOnFirstLine, isOnLastLine } = getTextareaLineBoundaryState(
              event.currentTarget,
              selectionStart
            )

            if (event.key === 'ArrowUp' && isOnFirstLine && previousItem) {
              event.preventDefault()
              focusListItem(blockId, previousItem.id, previousItem.content.length)
              return
            }

            if (event.key === 'ArrowUp' && isOnFirstLine) {
              const previousBlock = getPreviousBlock(blockId)

              if (!previousBlock) return

              event.preventDefault()
              focusBlock(previousBlock.id, 'end')
              return
            }

            if (event.key === 'ArrowDown' && isOnLastLine && nextItem) {
              event.preventDefault()
              focusListItem(blockId, nextItem.id, 0)
              return
            }

            if (event.key === 'ArrowDown' && isOnLastLine) {
              const nextBlock = getNextBlock(blockId)

              if (!nextBlock) return

              event.preventDefault()
              focusBlock(nextBlock.id, 'start')
            }
          }
        }

        return (
          <div
            key={item.id}
            className="flex items-start gap-3"
            style={{ paddingLeft: `${item.indent * indentWidth}px` }}
          >
            <span className="text-muted-foreground pt-2 text-base leading-relaxed select-none">
              {marker}
            </span>
            <Textarea
              ref={(node) => setItemRef(item.id, node)}
              value={item.content}
              onChange={(event) => updateListItem(blockId, item.id, event.target.value)}
              onKeyDown={handleKeyDown}
              data-block-id={blockId}
              data-block-kind="list-item"
              placeholder={itemIndex === 0 ? 'List item' : undefined}
              className="placeholder:text-muted-foreground min-h-0 resize-none border-0 bg-transparent px-0 py-0 font-serif text-xl! leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
        )
      })}
    </div>
  )
}

export default ListBlock
