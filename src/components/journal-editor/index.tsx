'use client'

import type { DragEndEvent } from '@dnd-kit/react'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { Provider as JotaiProvider } from 'jotai'
import { useState, type ReactNode } from 'react'
import { createJournalBlocksStore } from '@/components/journal-editor/atoms'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'
import ResolveBlock from '@/components/journal-editor/blocks/resolve-block'
import JournalDialog from '@/components/journal-editor/journal-dialog'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
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
  const { blocks, moveBlock } = useJournalBlocks()

  const handleDragEnd = ({ canceled, operation }: DragEndEvent) => {
    if (canceled) return

    const activeId = operation.source?.id
    const overId = operation.target?.id

    if (typeof activeId !== 'string' || typeof overId !== 'string') return

    moveBlock(activeId, overId)
  }

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col gap-4">
      <JournalHeader />

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <SortableBlockRow key={block.id!} blockId={block.id!} index={index}>
              <ResolveBlock block={block} blockId={block.id!} />
            </SortableBlockRow>
          ))}
        </div>
      </DragDropProvider>

      <JournalDialog />
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
