'use client'

import JournalEditor from '@/components/journal-editor'
import { useJournalBySlug } from '@/hooks/use-journals'
import { EntryEditSkeleton } from '../../_components/entry-skeletons'
import DeleteJournalButton from './delete-journal-button'
import RegenerateSlugButton from './regenerate-slug-button'

type EntryEditProps = {
  slug: string
}

const EntryEdit = ({ slug }: EntryEditProps) => {
  const { data: journal, isLoading } = useJournalBySlug(slug)

  if (isLoading) {
    return <EntryEditSkeleton />
  }

  if (!journal) {
    return <p className="text-muted-foreground">Entry not found.</p>
  }

  return (
    <JournalEditor
      initialJournalId={journal.id}
      initialTitle={journal.title ?? ''}
      initialDate={journal.date}
      initialCreatedAt={journal.created_at}
      initialBlocks={journal.blocks}
      initialPlaces={journal.places}
      initialThumbnailAssetId={journal.thumbnailAssetId}
      successMessage="Journal saved"
      isEditMode
      viewHref={`/entries/${slug}`}
      headerActions={
        <>
          <RegenerateSlugButton journalId={journal.id} slug={slug} />
          <DeleteJournalButton journalId={journal.id} slug={slug} />
        </>
      }
    />
  )
}

export default EntryEdit
