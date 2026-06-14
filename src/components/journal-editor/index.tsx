'use client'

import { Provider as JotaiProvider } from 'jotai'
import Link from 'next/link'
import { useState } from 'react'
import { createJournalBlocksStore } from '@/components/journal-editor/atoms'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'
import ImageBlock, {
  ImageUploadDialog,
} from '@/components/journal-editor/blocks/image-block'
import TextBlock from '@/components/journal-editor/blocks/text-block'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
import type {
  ImageJournalBlock,
  JournalEditorProps,
  TextJournalBlock,
} from '@/components/journal-editor/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const JournalEditor = ({
  initialJournalId,
  initialTitle = '',
  initialBlocks,
  successMessage = 'Journal saved',
  isEditMode = false,
  viewHref,
  headerActions,
}: JournalEditorProps) => {
  const [store] = useState(() => createJournalBlocksStore({ initialBlocks }))
  const {
    actions,
    blocks,
    errorMessage,
    isUploadDialogOpen,
    pendingFiles,
    saveMutation,
    title,
    uploadInputId,
  } = useJournalBlocks({
    initialJournalId,
    initialTitle,
    store,
    successMessage,
  })

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(event) => actions.setTitle(event.target.value)}
            placeholder="Title"
            className="placeholder:text-muted-foreground h-14 overflow-hidden border-0 bg-transparent px-0 py-0 font-serif text-3xl leading-tight font-semibold shadow-none focus-visible:ring-0 md:h-16 md:text-4xl dark:bg-transparent"
          />
          <div className="flex items-center gap-2">
            {isEditMode && viewHref && (
              <Button variant="outline" asChild>
                <Link href={viewHref}>View entry</Link>
              </Button>
            )}
            <Button
              type="button"
              onClick={actions.save}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? 'Saving...'
                : isEditMode
                  ? 'Save changes'
                  : 'Save'}
            </Button>
            {headerActions}
          </div>
        </div>
        {isEditMode && <Badge variant="secondary">Editing</Badge>}
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <JotaiProvider store={store}>
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <div
              key={block.id ?? `${block.type}-${index}`}
              className="group relative overflow-visible"
            >
              <div className="absolute top-2 -left-10">
                <BlockMenu blockId={block.id!} />
              </div>

              {block.type === 'text' ? (
                <TextBlock
                  block={block as TextJournalBlock}
                  blockId={block.id!}
                />
              ) : (
                <ImageBlock
                  block={block as ImageJournalBlock}
                  blockId={block.id!}
                />
              )}
            </div>
          ))}
        </div>

        <ImageUploadDialog
          isOpen={isUploadDialogOpen}
          pendingFiles={pendingFiles}
          uploadInputId={uploadInputId}
          onOpenChange={actions.handleUploadDialogOpenChange}
          onFilesChange={actions.setPendingFiles}
          onUpload={actions.uploadImages}
        />
      </JotaiProvider>
    </section>
  )
}

export default JournalEditor
