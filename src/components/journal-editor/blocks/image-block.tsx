'use client'

import Image from 'next/image'
import type { KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
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

const ImageBlock = ({ block, blockId }: ImageBlockProps) => {
  const { insertBlockBelow, removeImage, updateImageCaption } = useJournalBlocks()

  const handleCaptionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      insertBlockBelow(blockId, 'text')
    }
  }

  return (
    <div className="space-y-3">
      {block.images.length > 1 ? (
        <div className="px-12">
          <Carousel opts={{ loop: false }}>
            <CarouselContent>
              {block.images.map((image, imageIndex) => (
                <CarouselItem key={image.id ?? image.cloudinary_public_id}>
                  <ImageItem
                    alt={image.alt_text || 'Journal image'}
                    publicId={image.cloudinary_public_id}
                    width={image.width}
                    height={image.height}
                    onRemove={() => removeImage(blockId, imageIndex)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ) : block.images[0] ? (
        <ImageItem
          alt={block.images[0].alt_text || 'Journal image'}
          publicId={block.images[0].cloudinary_public_id}
          width={block.images[0].width}
          height={block.images[0].height}
          onRemove={() => removeImage(blockId, 0)}
        />
      ) : null}

      <Input
        value={block.caption ?? ''}
        onChange={(event) => updateImageCaption(blockId, event.target.value)}
        onKeyDown={handleCaptionKeyDown}
        placeholder="Add a caption (optional)"
        className="text-sm"
      />
    </div>
  )
}

export default ImageBlock
