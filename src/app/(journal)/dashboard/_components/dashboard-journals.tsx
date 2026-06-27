'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useJournals } from '@/hooks/use-journals'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const DashboardJournals = () => {
  const { data: journals, isLoading } = useJournals()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your Journals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse your latest entries.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-6">
            <CardDescription>Loading journals...</CardDescription>
          </CardContent>
        </Card>
      ) : journals?.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {journals.map((journal) => {
            const title = journal.title?.trim() || 'Untitled Journal'

            const cardBody = (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-1 text-base font-medium">
                      {dateFormatter.format(new Date(journal.created_at))} - {title}
                    </CardTitle>
                    {journal.has_unsaved_draft && <Badge>Draft</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-4 leading-relaxed">
                    {journal.excerpt}
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
            <CardTitle className="text-base font-medium">No journals yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Start writing from the Write page and your entries will appear here.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DashboardJournals
