'use client'

import type { DragEndEvent } from '@dnd-kit/react'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { Provider as JotaiProvider } from 'jotai'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { createJournalBlocksStore } from '@/components/journal-editor/atoms'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'
import ImageDialog from '@/components/journal-editor/image-dialog'
import ResolveBlock from '@/components/journal-editor/blocks/resolve-block'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import JournalHeader from '@/components/journal-editor/journal-header'
import type { JournalEditorProps } from '@/components/journal-editor/types'
import { getTextareaLineBoundaryState } from '@/components/journal-editor/utils'
import { cn } from '@/lib/utils'

const sortableGroupId = 'journal-editor-blocks'

type SortableBlockRowProps = {
  blockId: string
  index: number
  children: ReactNode
}

const SortableBlockRow = ({
  blockId,
  index,
  children,
}: SortableBlockRowProps) => {
  const { handleRef, isDragging, ref } = useSortable({
    id: blockId,
    index,
    group: sortableGroupId,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'group relative overflow-visible',
        isDragging && 'z-10 opacity-70'
      )}
    >
      <div className="absolute -left-20">
        <BlockMenu blockId={blockId} dragHandleRef={handleRef} />
      </div>

      {children}
    </div>
  )
}

const JournalEditorContent = () => {
  const { blocks, focusBlock, getNextBlock, getPreviousBlock, moveBlock } =
    useJournalEditor()

  const handleDragEnd = ({ canceled, operation }: DragEndEvent) => {
    if (canceled) return

    if (isSortableOperation(operation)) {
      const { source } = operation
      if (!source) return

      moveBlock(source.initialIndex, source.index)
      return
    }

    const activeId = operation.source?.id
    const overId = operation.target?.id

    if (typeof activeId !== 'string' || typeof overId !== 'string') return

    const fromIndex = blocks.findIndex((block) => block.id === activeId)
    const toIndex = blocks.findIndex((block) => block.id === overId)

    moveBlock(fromIndex, toIndex)
  }

  const handleKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

    const target = event.target
    if (
      !(
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement
      )
    ) {
      return
    }

    const blockId = target.dataset.blockId
    if (!blockId) return
    if (target.dataset.blockKind === 'list-item') return

    const selectionStart = target.selectionStart
    const selectionEnd = target.selectionEnd

    if (selectionStart === null || selectionEnd === null) return
    if (selectionStart !== selectionEnd) return

    const isMovingUp = event.key === 'ArrowUp'
    const adjacentBlock = isMovingUp
      ? getPreviousBlock(blockId)
      : getNextBlock(blockId)

    if (!adjacentBlock) return

    if (target instanceof HTMLTextAreaElement) {
      const { isOnFirstLine, isOnLastLine } = getTextareaLineBoundaryState(
        target,
        selectionStart
      )

      if (isMovingUp && !isOnFirstLine) return
      if (!isMovingUp && !isOnLastLine) return
    } else {
      const isAtStart = selectionStart === 0
      const isAtEnd = selectionStart === target.value.length

      if (isMovingUp && !isAtStart) return
      if (!isMovingUp && !isAtEnd) return
    }

    event.preventDefault()
    focusBlock(adjacentBlock.id, isMovingUp ? 'end' : 'start')
  }

  return (
    <section
      className="mx-auto flex w-full max-w-[800px] flex-col gap-4"
      onKeyDownCapture={handleKeyDownCapture}
    >
      <JournalHeader />

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <SortableBlockRow key={block.id} blockId={block.id} index={index}>
              <ResolveBlock block={block} blockId={block.id} />
            </SortableBlockRow>
          ))}
        </div>
      </DragDropProvider>

      <ImageDialog />
    </section>
  )
}

const JournalEditor = ({
  initialJournalId,
  initialTitle = '',
  initialBlocks,
  successMessage = 'Journal saved',
  isEditMode = false,
  viewHref,
  headerActions,
}: JournalEditorProps) => {
  const [store] = useState(() =>
    createJournalBlocksStore({
      headerActions,
      initialBlocks,
      initialJournalId,
      initialTitle,
      isEditMode,
      successMessage,
      viewHref,
    })
  )

  return (
    <JotaiProvider store={store}>
      <JournalEditorContent />
    </JotaiProvider>
  )
}

export default JournalEditor
