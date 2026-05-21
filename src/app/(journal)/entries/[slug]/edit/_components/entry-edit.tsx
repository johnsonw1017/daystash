'use client'

import JournalEditor from '@/app/(journal)/write/_components/journal-editor'
import { useJournalBySlug } from '@/hooks/use-journals'

type EntryEditProps = {
  slug: string
}

const EntryEdit = ({ slug }: EntryEditProps) => {
  const { data: journal, isLoading } = useJournalBySlug(slug)

  if (isLoading) {
    return <p className="text-muted-foreground">Loading entry...</p>
  }

  if (!journal) {
    return <p className="text-muted-foreground">Entry not found.</p>
  }

  return (
    <JournalEditor
      initialJournalId={journal.id}
      initialTitle={journal.title ?? ''}
      initialContent={journal.content}
      successMessage="Journal updated"
      isEditMode
      viewHref={`/entries/${slug}`}
    />
  )
}

export default EntryEdit
