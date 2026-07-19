'use client'

import Image from 'next/image'
import { useCallback, useState, type KeyboardEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import ImageEditDialog from '@/components/journal-editor/image-edit-dialog'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import useFocusRegistry from '@/components/journal-editor/hooks/use-focus-registry'
import type { ImageJournalBlock } from '@/components/journal-editor/types'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Input } from '@/components/ui/input'
import { cloudinaryLoader } from '@/lib/cloudinary'
import { getCarouselViewportAspectRatio } from '@/lib/journal-image-block'

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
  onEdit: () => void
}

const ImageItem = ({
  alt,
  height,
  publicId,
  width,
  onRemove,
  onEdit,
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
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          onClick={onEdit}
          aria-label="Edit images"
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          onClick={() => void onRemove()}
          aria-label="Delete image"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}

const ImageBlock = ({ block, blockId }: ImageBlockProps) => {
  const { insertBlockBelow, removeImage, updateImageCaption } =
    useJournalEditor()
  const { registerFocusTarget } = useFocusRegistry()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const carouselAspectRatio = getCarouselViewportAspectRatio(block.images)

  const setCaptionRef = useCallback(
    (node: HTMLInputElement | null) => {
      registerFocusTarget(
        blockId,
        node
          ? {
              element: node,
              kind: 'input',
            }
          : null
      )
    },
    [blockId, registerFocusTarget]
  )

  const handleCaptionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      insertBlockBelow(blockId, 'text')
    }
  }

  return (
    <div className="space-y-5">
      {block.images.length > 1 ? (
        <div className="px-12">
          <Carousel opts={{ loop: false }}>
            <CarouselContent>
              {block.images.map((image, imageIndex) => (
                <CarouselItem key={image.assetId}>
                  <div
                    className="bg-muted/20 relative overflow-hidden rounded-md border"
                    style={{ aspectRatio: `${carouselAspectRatio}` }}
                  >
                    <div className="flex h-full items-center justify-center">
                      <Image
                        loader={cloudinaryLoader}
                        src={image.publicId}
                        alt={image.altText || 'Journal image'}
                        width={image.width}
                        height={image.height}
                        className="max-h-full w-auto max-w-full object-contain"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-xs"
                        onClick={() => setIsEditDialogOpen(true)}
                        aria-label="Edit images"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => removeImage(blockId, imageIndex)}
                        aria-label="Delete image"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ) : block.images[0] ? (
        <ImageItem
          alt={block.images[0].altText || 'Journal image'}
          publicId={block.images[0].publicId}
          width={block.images[0].width}
          height={block.images[0].height}
          onRemove={() => removeImage(blockId, 0)}
          onEdit={() => setIsEditDialogOpen(true)}
        />
      ) : null}

      <Input
        ref={setCaptionRef}
        value={block.caption ?? ''}
        onChange={(event) => updateImageCaption(blockId, event.target.value)}
        onKeyDown={handleCaptionKeyDown}
        data-block-id={blockId}
        data-block-kind="image-caption"
        placeholder="Add a caption (optional)"
        className="text-sm"
      />

      <ImageEditDialog
        block={block}
        blockId={blockId}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  )
}

export default ImageBlock
