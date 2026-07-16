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
        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    )
  }

  return (
    <div className="from-primary/15 via-secondary/10 to-accent/15 relative h-full w-full overflow-hidden bg-gradient-to-br">
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
    <Card className="group h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
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
