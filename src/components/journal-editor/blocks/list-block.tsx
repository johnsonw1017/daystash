'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { List, ListOrdered } from 'lucide-react'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import useFocusRegistry from '@/components/journal-editor/hooks/use-focus-registry'
import type { ListJournalBlock } from '@/components/journal-editor/types'
import { getTextareaLineBoundaryState } from '@/components/journal-editor/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ListBlockProps = {
  block: ListJournalBlock
  blockId: string
}

type ListItemRowProps = {
  blockId: string
  item: string
  itemCount: number
  itemIndex: number
  onSetItemRef: (itemIndex: number, node: HTMLTextAreaElement | null) => void
  previousItem: string | null
}

const ListItemRow = ({
  blockId,
  item,
  itemCount,
  itemIndex,
  onSetItemRef,
  previousItem,
}: ListItemRowProps) => {
  const {
    convertListBlockToTextBlock,
    focusBlock,
    focusListItem,
    focusTextBlock,
    getNextBlock,
    getPreviousBlock,
    mergeListItem,
    splitListItem,
    updateListItem,
  } = useJournalEditor()

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      onSetItemRef(itemIndex, node)
    },
    [itemIndex, onSetItemRef]
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd, value } = event.currentTarget
    const hasCollapsedSelection = selectionStart === selectionEnd
    const isAtStart = selectionStart === 0
    const isAtEnd = selectionStart === value.length
    const isEmptyItem = item.trim().length === 0
    const hasPreviousItem = itemIndex > 0
    const hasNextItem = itemIndex < itemCount - 1

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()

      if (isEmptyItem) {
        const nextTextBlockId = convertListBlockToTextBlock(blockId, itemIndex)
        focusTextBlock(nextTextBlockId, 0)
        return
      }

      const nextItemIndex = splitListItem(
        blockId,
        itemIndex,
        selectionStart,
        selectionEnd
      )
      focusListItem(blockId, nextItemIndex, 0)
      return
    }

    if (
      event.key === 'Backspace' &&
      hasCollapsedSelection &&
      isAtStart &&
      hasPreviousItem
    ) {
      event.preventDefault()
      const previousItemIndex = itemIndex - 1
      const previousItemLength = previousItem?.length ?? 0
      focusListItem(blockId, previousItemIndex, previousItemLength)
      mergeListItem(blockId, itemIndex, 'previous')
      return
    }

    if (
      event.key === 'Backspace' &&
      hasCollapsedSelection &&
      isAtStart &&
      isEmptyItem
    ) {
      event.preventDefault()
      const nextTextBlockId = convertListBlockToTextBlock(blockId, itemIndex)
      focusTextBlock(nextTextBlockId, 0)
      return
    }

    if (
      event.key === 'Delete' &&
      hasCollapsedSelection &&
      isAtEnd &&
      hasNextItem
    ) {
      event.preventDefault()
      focusListItem(blockId, itemIndex, selectionStart)
      mergeListItem(blockId, itemIndex, 'next')
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

      if (event.key === 'ArrowUp' && isOnFirstLine && hasPreviousItem) {
        event.preventDefault()
        focusListItem(blockId, itemIndex - 1, previousItem?.length ?? 0)
        return
      }

      if (event.key === 'ArrowUp' && isOnFirstLine) {
        const previousBlock = getPreviousBlock(blockId)

        if (!previousBlock) return

        event.preventDefault()
        focusBlock(previousBlock.id, 'end')
        return
      }

      if (event.key === 'ArrowDown' && isOnLastLine && hasNextItem) {
        event.preventDefault()
        focusListItem(blockId, itemIndex + 1, 0)
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
    <li>
      <Textarea
        ref={setTextareaRef}
        value={item}
        onChange={(event) =>
          updateListItem(blockId, itemIndex, event.target.value)
        }
        onKeyDown={handleKeyDown}
        data-block-id={blockId}
        data-block-kind="list-item"
        placeholder={
          itemCount === 1 && itemIndex === 0 ? 'List item' : undefined
        }
        className="placeholder:text-muted-foreground block min-h-0 w-full resize-none border-0 bg-transparent px-0 py-0 font-serif text-xl! leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
    </li>
  )
}

const ListBlock = ({ block, blockId }: ListBlockProps) => {
  const { updateListStyle } = useJournalEditor()
  const { registerFocusTarget } = useFocusRegistry()
  const itemRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})

  const getBoundaryElement = useCallback(
    (placement: 'start' | 'end') => {
      const indexes =
        placement === 'start'
          ? block.items.map((_, index) => index)
          : block.items.map((_, index) => index).reverse()

      return (
        indexes
          .map((itemIndex) => itemRefs.current[itemIndex] ?? null)
          .find(
            (element): element is HTMLTextAreaElement => element !== null
          ) ?? null
      )
    },
    [block.items]
  )

  useEffect(() => {
    registerFocusTarget(blockId, {
      kind: 'list',
      getElement: getBoundaryElement,
    })

    return () => {
      registerFocusTarget(blockId, null)
    }
  }, [blockId, getBoundaryElement, registerFocusTarget])

  const setItemRef = useCallback(
    (itemIndex: number, node: HTMLTextAreaElement | null) => {
      itemRefs.current[itemIndex] = node

      registerFocusTarget(
        `${blockId}:${itemIndex}`,
        node ? { element: node, kind: 'textarea' } : null
      )
    },
    [blockId, registerFocusTarget]
  )

  const ListTag = block.style === 'numbered' ? 'ol' : 'ul'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant={block.style === 'bullet' ? 'secondary' : 'ghost'}
          size="xs"
          onClick={() => updateListStyle(blockId, 'bullet')}
          aria-pressed={block.style === 'bullet'}
          className="h-7 px-2.5"
        >
          <List />
          <span>Bullets</span>
        </Button>
        <Button
          type="button"
          variant={block.style === 'numbered' ? 'secondary' : 'ghost'}
          size="xs"
          onClick={() => updateListStyle(blockId, 'numbered')}
          aria-pressed={block.style === 'numbered'}
          className="h-7 px-2.5"
        >
          <ListOrdered />
          <span>Numbers</span>
        </Button>
      </div>

      <ListTag
        className={cn(
          'list-outside pl-6 marker:text-base',
          block.style === 'numbered' ? 'list-decimal' : 'list-disc'
        )}
      >
        {block.items.map((item, itemIndex) => (
          <ListItemRow
            key={itemIndex}
            blockId={blockId}
            item={item}
            itemCount={block.items.length}
            itemIndex={itemIndex}
            onSetItemRef={setItemRef}
            previousItem={block.items[itemIndex - 1] ?? null}
          />
        ))}
      </ListTag>
    </div>
  )
}

export default ListBlock
