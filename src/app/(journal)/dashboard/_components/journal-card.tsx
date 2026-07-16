import Image from 'next/image'
import Link from 'next/link'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cloudinaryLoader } from '@/lib/cloudinary'
import type { JournalListItem } from '@/lib/journals'

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
})

const JournalThumbnail = ({ journal }: { journal: JournalListItem }) => {
  if (journal.thumbnail) {
    return (
      <Image
        loader={cloudinaryLoader}
        src={journal.thumbnail.publicId}
        alt=""
        fill
        sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    )
  }

  return (
    <div className="from-primary/15 via-secondary/10 to-accent/15 relative h-full w-full overflow-hidden bg-linear-to-br">
      <Image
        src="/daystash-leaf.svg"
        alt=""
        fill
        sizes="(min-width: 1280px) 352px, (min-width: 768px) 50vw, 100vw"
        className="translate-x-6 translate-y-14 scale-125 rotate-12 object-contain object-right opacity-25 dark:opacity-20"
      />
    </div>
  )
}

const JournalCard = ({ journal }: { journal: JournalListItem }) => {
  const title = journal.title?.trim() || 'Untitled Journal'
  const content = (
    <div className="group relative h-full">
      <div
        aria-hidden="true"
        className="bg-foreground/20 absolute inset-x-[5%] top-4 -bottom-2 rounded-xl opacity-0 blur-xl transition-opacity duration-500 ease-[cubic-bezier(0.25,0.45,0.45,0.95)] group-hover:opacity-30 motion-reduce:transition-none"
      />
      <Card className="relative z-10 h-full transform-gpu gap-0 overflow-hidden py-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.45,0.45,0.95)] motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none">
        <div className="bg-muted relative aspect-4/3 overflow-hidden">
          <JournalThumbnail journal={journal} />
        </div>
        <CardHeader className="gap-2 p-4 sm:p-5">
          <CardDescription>
            {dateFormatter.format(new Date(journal.created_at))}
          </CardDescription>
          <CardTitle className="line-clamp-2 text-base leading-snug font-medium">
            {title}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )

  if (!journal.slug) {
    return <div>{content}</div>
  }

  return (
    <Link
      href={`/entries/${journal.slug}`}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {content}
    </Link>
  )
}

export default JournalCard
