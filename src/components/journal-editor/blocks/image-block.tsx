'use client'

import Image from 'next/image'
import type { KeyboardEvent } from 'react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import useImageBlock from '@/components/journal-editor/hooks/use-image-block'
import type { ImageJournalBlock } from '@/components/journal-editor/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cloudinaryLoader } from '@/lib/cloudinary'

type ImageBlockProps = {
  block: ImageJournalBlock
  blockId: string
}

type ImageItemProps = {
  alt: string
  height: number
  publicId: string
  width: number
  onRemove: () => void | Promise<void>
}

type ImageUploadDialogProps = {
  isOpen: boolean
  pendingFiles: File[]
  uploadInputId: string
  onOpenChange: (open: boolean) => void
  onFilesChange: (files: File[]) => void
  onUpload: () => void | Promise<void>
}

const ImageItem = ({
  alt,
  height,
  publicId,
  width,
  onRemove,
}: ImageItemProps) => {
  return (
    <div className="relative overflow-hidden rounded-md border">
      <Image
        loader={cloudinaryLoader}
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full object-contain"
      />
      <Button
        type="button"
        variant="destructive"
        size="icon-xs"
        className="absolute top-2 right-2"
        onClick={() => void onRemove()}
        aria-label="Delete image"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

export const ImageUploadDialog = ({
  isOpen,
  pendingFiles,
  uploadInputId,
  onOpenChange,
  onFilesChange,
  onUpload,
}: ImageUploadDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add images</DialogTitle>
          <DialogDescription>
            Upload one or more images into a new image block.
          </DialogDescription>
        </DialogHeader>

        <Label
          htmlFor={uploadInputId}
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed p-4 text-center"
        >
          <Upload className="text-muted-foreground" />
          <span className="text-sm">Drag and drop or browse your files</span>
          <Input
            id={uploadInputId}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              onFilesChange(Array.from(event.target.files ?? []))
            }}
          />
        </Label>

        {pendingFiles.length > 0 && (
          <div className="mt-1 space-y-2">
            {pendingFiles.map((file) => (
              <div
                key={`${file.name}-${file.size}`}
                className="text-muted-foreground text-sm"
              >
                {file.name}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onUpload()}
            disabled={pendingFiles.length === 0}
          >
            <ImageIcon />
            Upload images
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ImageBlock = ({ block, blockId }: ImageBlockProps) => {
  const { addBelow, removeImage, updateCaption } = useImageBlock(blockId)

  const handleCaptionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      addBelow()
    }
  }

  return (
    <div className="space-y-3">
      {block.images.length > 1 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {block.images.map((image, imageIndex) => (
            <ImageItem
              key={image.id ?? image.cloudinary_public_id}
              alt={image.alt_text || 'Journal image'}
              publicId={image.cloudinary_public_id}
              width={image.width}
              height={image.height}
              onRemove={() => removeImage(imageIndex)}
            />
          ))}
        </div>
      ) : block.images[0] ? (
        <ImageItem
          alt={block.images[0].alt_text || 'Journal image'}
          publicId={block.images[0].cloudinary_public_id}
          width={block.images[0].width}
          height={block.images[0].height}
          onRemove={() => removeImage(0)}
        />
      ) : null}

      <Input
        value={block.caption ?? ''}
        onChange={(event) => updateCaption(event.target.value)}
        onKeyDown={handleCaptionKeyDown}
        placeholder="Add a caption (optional)"
        className="text-sm"
      />
    </div>
  )
}

export default ImageBlock
