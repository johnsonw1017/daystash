import { requireAuth } from '@/lib/auth/require-auth'
import { createServerSideClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const DashboardPage = async () => {
  const user = await requireAuth('/dashboard')
  const supabase = await createServerSideClient()

  const { data: journals, error } = await supabase
    .from('journals')
    .select('id, title, created_at, slug')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const journalIds = (journals ?? []).map((journal) => journal.id)

  const { data: blocks, error: blocksError } = journalIds.length
    ? await supabase
        .from('journal_blocks')
        .select('journal_id, text_content, position')
        .in('journal_id', journalIds)
        .eq('type', 'text')
        .order('position', { ascending: true })
    : { data: [], error: null }

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const firstParagraphByJournalId = new Map<string, string>()

  for (const block of blocks ?? []) {
    if (!firstParagraphByJournalId.has(block.journal_id)) {
      firstParagraphByJournalId.set(block.journal_id, block.text_content ?? '')
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your Journals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse your latest entries.
        </p>
      </div>

      {journals?.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {journals.map((journal) => {
            const title = journal.title?.trim() || 'Untitled Journal'
            const excerpt =
              firstParagraphByJournalId.get(journal.id)?.trim() ||
              'No journal text yet.'

            const cardBody = (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-base font-medium">
                    {dateFormatter.format(new Date(journal.created_at))} - {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-4 leading-relaxed">
                    {excerpt}
                  </CardDescription>
                </CardContent>
              </Card>
            )

            if (!journal.slug) {
              return <div key={journal.id}>{cardBody}</div>
            }

            return (
              <Link key={journal.id} href={`/entries/${journal.slug}`}>
                {cardBody}
              </Link>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              No journals yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Start writing from the Write page and your entries will appear
              here.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardPage
