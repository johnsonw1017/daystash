'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { useJournalBySlug } from '@/hooks/use-journals'
import { cloudinaryLoader } from '@/lib/cloudinary'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

type EntryViewProps = {
  slug: string
}

const EntryView = ({ slug }: EntryViewProps) => {
  const { data: journal, isLoading } = useJournalBySlug(slug)

  if (isLoading) {
    return <p className="text-muted-foreground">Loading entry...</p>
  }

  if (!journal) {
    return <p className="text-muted-foreground">Entry not found.</p>
  }

  return (
    <section className="mx-auto flex w-full max-w-[800px] flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold md:text-4xl">
            {journal.title?.trim() || 'Untitled Journal'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {dateFormatter.format(new Date(journal.created_at))}
          </p>
        </div>
        <Button asChild>
          <Link href={`/entries/${journal.slug}/edit`}>Edit</Link>
        </Button>
      </div>

      <article className="space-y-5 font-serif text-xl leading-relaxed">
        {journal.blocks.length === 0 && (
          <p className="whitespace-pre-wrap">No journal content yet.</p>
        )}

        {journal.blocks.map((block) => {
          if (block.type === 'text') {
            return (
              <p key={block.id} className="whitespace-pre-wrap">
                {block.content}
              </p>
            )
          }

          const key = block.id

          return (
            <figure key={key} className="space-y-2">
              {block.images.length > 1 ? (
                <div className="px-12">
                  <Carousel opts={{ loop: false }}>
                    <CarouselContent>
                      {block.images.map((image) => {
                        return (
                          <CarouselItem key={image.assetId}>
                            <Image
                              loader={cloudinaryLoader}
                              src={image.publicId}
                              alt={image.altText || 'Journal image'}
                              width={image.width}
                              height={image.height}
                              className="h-auto w-full rounded-md object-contain"
                            />
                          </CarouselItem>
                        )
                      })}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              ) : block.images[0] ? (
                <Image
                  loader={cloudinaryLoader}
                  src={block.images[0].publicId}
                  alt={block.images[0].altText || 'Journal image'}
                  width={block.images[0].width}
                  height={block.images[0].height}
                  className="h-auto w-full rounded-md object-contain"
                />
              ) : null}

              {block.caption?.trim() && (
                <figcaption className="text-muted-foreground text-base">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          )
        })}
      </article>
    </section>
  )
}

export default EntryView
