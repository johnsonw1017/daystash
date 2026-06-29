'use client'

import type { DragEndEvent } from '@dnd-kit/react'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortableOperation, useSortable } from '@dnd-kit/react/sortable'
import { useSetAtom } from 'jotai'
import Image from 'next/image'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { imageDialogStateAtom } from '@/components/journal-editor/atoms'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import type { ImageJournalBlock } from '@/components/journal-editor/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cloudinaryLoader } from '@/lib/cloudinary'
import { MAX_IMAGE_BLOCK_IMAGES } from '@/lib/journal-image-block'
import { cn } from '@/lib/utils'

const sortableGroupId = 'journal-image-grid'

type ImageEditDialogProps = {
  block: ImageJournalBlock
  blockId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SortableImageTileProps = {
  image: ImageJournalBlock['images'][number]
  index: number
  onDelete: () => void
}

const SortableImageTile = ({
  image,
  index,
  onDelete,
}: SortableImageTileProps) => {
  const { handleRef, isDragging, ref } = useSortable({
    id: image.assetId,
    index,
    group: sortableGroupId,
  })

  return (
    <div
      ref={ref}
      className={cn(
        'bg-muted/30 relative aspect-square overflow-hidden rounded-xl border',
        isDragging && 'z-10 opacity-70'
      )}
    >
      <Image
        loader={cloudinaryLoader}
        src={image.publicId}
        alt={image.altText || 'Journal image'}
        fill
        sizes="(max-width: 768px) 40vw, 20vw"
        className="object-cover"
      />
      <button
        ref={handleRef}
        type="button"
        className="absolute top-2 left-2 rounded-full bg-background/90 p-1.5 shadow-sm"
        aria-label={`Reorder image ${index + 1}`}
      >
        <GripVertical className="size-4" />
      </button>
      <Button
        type="button"
        variant="destructive"
        size="icon-xs"
        className="absolute top-2 right-2"
        onClick={onDelete}
        aria-label={`Delete image ${index + 1}`}
      >
        <Trash2 />
      </Button>
    </div>
  )
}

const ImageEditDialog = ({
  block,
  blockId,
  open,
  onOpenChange,
}: ImageEditDialogProps) => {
  const setImageDialogState = useSetAtom(imageDialogStateAtom)
  const { moveImage, removeImage } = useJournalEditor()
  const canAddImage = block.images.length < MAX_IMAGE_BLOCK_IMAGES

  const handleDragEnd = ({ canceled, operation }: DragEndEvent) => {
    if (canceled || !isSortableOperation(operation)) return

    const { source } = operation
    if (!source) return

    moveImage(blockId, source.initialIndex, source.index)
  }

  const handleAddImage = () => {
    if (!canAddImage) return

    setImageDialogState({
      isOpen: true,
      insertBelowBlockId: blockId,
      targetBlockId: blockId,
      mobileSession: null,
      mode: 'device',
      pendingFiles: [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit images</DialogTitle>
          <DialogDescription>
            Drag to reorder, remove anything you do not want, or add more images up to {MAX_IMAGE_BLOCK_IMAGES}.
          </DialogDescription>
        </DialogHeader>

        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {block.images.map((image, index) => (
              <SortableImageTile
                key={image.assetId}
                image={image}
                index={index}
                onDelete={() => removeImage(blockId, index)}
              />
            ))}

            {canAddImage && (
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-muted/20 text-muted-foreground hover:border-foreground hover:text-foreground flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors"
              >
                <Plus className="size-5" />
                <span className="text-sm font-medium">Add image</span>
              </button>
            )}
          </div>
        </DragDropProvider>
      </DialogContent>
    </Dialog>
  )
}

export default ImageEditDialog
