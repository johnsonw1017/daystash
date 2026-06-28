'use client'

import type { DragEndEvent } from '@dnd-kit/react'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { Provider as JotaiProvider } from 'jotai'
import { useState, type ReactNode } from 'react'
import { createJournalBlocksStore } from '@/components/journal-editor/atoms'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'
import ImageDialog from '@/components/journal-editor/image-dialog'
import ResolveBlock from '@/components/journal-editor/blocks/resolve-block'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import JournalHeader from '@/components/journal-editor/journal-header'
import type { JournalEditorProps } from '@/components/journal-editor/types'
import { cn } from '@/lib/utils'

const sortableGroupId = 'journal-editor-blocks'

type SortableBlockRowProps = {
  blockId: string
  index: number
  children: ReactNode
}

const SortableBlockRow = ({ blockId, index, children }: SortableBlockRowProps) => {
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
      <div className="absolute top-2 -left-20">
        <BlockMenu blockId={blockId} dragHandleRef={handleRef} />
      </div>

      {children}
    </div>
  )
}

const JournalEditorContent = () => {
  const { blocks, moveBlock } = useJournalEditor()

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

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col gap-4">
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
