'use client'

import { Provider as JotaiProvider } from 'jotai'
import { useState } from 'react'
import { createJournalBlocksStore } from '@/components/journal-editor/atoms'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'
import ResolveBlock from '@/components/journal-editor/blocks/resolve-block'
import JournalDialog from '@/components/journal-editor/journal-dialog'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
import JournalHeader from '@/components/journal-editor/journal-header'
import type { JournalEditorProps } from '@/components/journal-editor/types'

const JournalEditorContent = () => {
  const { blocks } = useJournalBlocks()

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col gap-4">
      <JournalHeader />

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={block.id ?? `${block.type}-${index}`}
            className="group relative overflow-visible"
          >
            <div className="absolute top-2 -left-10">
              <BlockMenu blockId={block.id!} />
            </div>

            <ResolveBlock block={block} blockId={block.id!} />
          </div>
        ))}
      </div>

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
