import Image from 'next/image'
import Link from 'next/link'
import { parseISO } from 'date-fns'
import { cloudinaryLoader } from '@/lib/cloudinary'
import type { JournalSearchResult as JournalSearchResultType } from '@/lib/journals'

const dateFormatter = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const START_HIGHLIGHT = '[[HIGHLIGHT]]'
const END_HIGHLIGHT = '[[/HIGHLIGHT]]'

const SearchExcerpt = ({ excerpt }: { excerpt: string }) => {
  const parts: React.ReactNode[] = []
  let cursor = 0
  let key = 0

  while (cursor < excerpt.length) {
    const start = excerpt.indexOf(START_HIGHLIGHT, cursor)
    if (start < 0) {
      parts.push(excerpt.slice(cursor))
      break
    }

    const end = excerpt.indexOf(END_HIGHLIGHT, start + START_HIGHLIGHT.length)
    if (end < 0) {
      parts.push(excerpt.slice(cursor))
      break
    }

    if (start > cursor) {
      parts.push(excerpt.slice(cursor, start))
    }

    parts.push(
      <mark key={key++} className="bg-accent/20 text-inherit">
        {excerpt.slice(start + START_HIGHLIGHT.length, end)}
      </mark>
    )
    cursor = end + END_HIGHLIGHT.length
  }

  return <>{parts}</>
}

const JournalSearchResult = ({
  journal,
}: {
  journal: JournalSearchResultType
}) => (
  <li>
    <Link
      href={`/entries/${journal.slug}`}
      className="focus-visible:ring-ring hover:bg-card/60 grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl px-3 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-4"
    >
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">
          {dateFormatter.format(parseISO(journal.date))}
        </p>
        <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">
          {journal.title?.trim() || 'Untitled Journal'}
        </h2>
        {journal.excerpt && (
          <p className="text-muted-foreground mt-2 line-clamp-3 font-serif text-base leading-relaxed sm:text-lg">
            <SearchExcerpt excerpt={journal.excerpt} />
          </p>
        )}
      </div>
      {journal.thumbnail && (
        <div className="bg-muted relative size-20 overflow-hidden rounded-lg sm:size-24">
          <Image
            loader={cloudinaryLoader}
            src={journal.thumbnail.publicId}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      )}
    </Link>
  </li>
)

export { SearchExcerpt }
export default JournalSearchResult
