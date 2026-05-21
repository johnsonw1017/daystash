import { notFound } from 'next/navigation'
import JournalEditor from '@/app/(journal)/write/_components/journal-editor'
import { requireAuth } from '@/lib/auth/require-auth'
import { createServerSideClient } from '@/lib/supabase/server'

type EntryEditPageProps = {
  params: Promise<{
    slug: string
  }>
}

const EntryEditPage = async ({ params }: EntryEditPageProps) => {
  const { slug } = await params
  const user = await requireAuth(`/entries/${slug}/edit`)
  const supabase = await createServerSideClient()

  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id, title')
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
      <JournalEditor
        initialJournalId={journal.id}
        initialTitle={journal.title ?? ''}
        initialContent={content}
        successMessage="Journal updated"
      />
    </div>
  )
}

export default EntryEditPage
