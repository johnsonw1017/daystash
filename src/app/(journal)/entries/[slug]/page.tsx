import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth/require-auth'
import { createServerSideClient } from '@/lib/supabase/server'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

type EntryPageProps = {
  params: Promise<{
    slug: string
  }>
}

const EntryPage = async ({ params }: EntryPageProps) => {
  const { slug } = await params
  const user = await requireAuth(`/entries/${slug}`)
  const supabase = await createServerSideClient()

  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id, title, created_at, slug')
    .eq('user_id', user.id)
    .eq('slug', slug)
    .single()

  if (journalError || !journal) {
    notFound()
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('journal_blocks')
    .select('text_content, position')
    .eq('journal_id', journal.id)
    .eq('type', 'text')
    .order('position', { ascending: true })

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const content = (blocks ?? [])
    .map((block) => block.text_content?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n')

  return (
    <div className="px-4 pb-10">
      <section className="mx-auto flex w-full max-w-[210mm] flex-col gap-4">
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

        <article className="font-serif text-xl leading-relaxed whitespace-pre-wrap">
          {content || 'No journal text yet.'}
        </article>
      </section>
    </div>
  )
}

export default EntryPage
