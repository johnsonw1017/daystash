'use client'

import Link from 'next/link'
import BlockMenu from '@/components/journal-editor/blocks/block-menu'
import ImageBlock from '@/components/journal-editor/blocks/image/image-block'
import ImageUploadDialog from '@/components/journal-editor/blocks/image/image-upload-dialog'
import TextBlock from '@/components/journal-editor/blocks/text-block'
import useJournalEditor from '@/components/journal-editor/use-journal-editor'
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
  const {
    actions,
    blocks,
    errorMessage,
    isUploadDialogOpen,
    pendingFiles,
    saveMutation,
    textAreaRefs,
    title,
    uploadInputId,
  } = useJournalEditor({
    initialBlocks,
    initialJournalId,
    initialTitle,
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
            className="placeholder:text-muted-foreground h-14 overflow-hidden border-0 bg-transparent px-0 py-0 font-serif text-3xl leading-tight font-semibold shadow-none focus-visible:ring-0 md:h-16 md:text-4xl"
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

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <div
            key={block.id ?? `${block.type}-${index}`}
            className="group relative overflow-visible"
          >
            <div className="absolute top-2 -left-10">
              <BlockMenu
                onAddText={() => actions.addTextBlockBelow(index)}
                onAddImage={() => actions.openUploadDialog(index)}
              />
            </div>

            {block.type === 'text' ? (
              <TextBlock
                block={block as TextJournalBlock}
                blockCount={blocks.length}
                onChange={(value) => actions.updateTextBlock(index, value)}
                onAddBelow={() => actions.addTextBlockBelow(index)}
                onRemove={() => actions.removeTextBlock(index)}
                textareaRef={(node) => {
                  textAreaRefs.current[index] = node
                }}
              />
            ) : (
              <ImageBlock
                block={block as ImageJournalBlock}
                onCaptionChange={(value) => actions.updateImageCaption(index, value)}
                onAddBelow={() => actions.addTextBlockBelow(index)}
                onRemoveImage={(imageIndex) => actions.removeImage(index, imageIndex)}
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
    </section>
  )
}

export default JournalEditor
