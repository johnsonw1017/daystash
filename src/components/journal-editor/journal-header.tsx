'use client'

import Link from 'next/link'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const JournalHeader = () => {
  const {
    discard,
    errorMessage,
    headerActions,
    hasPersistedDraft,
    isDirty,
    isDiscarding,
    isEditMode,
    isPublishing,
    isSavingDraft,
    publish,
    saveDraft,
    setTitle,
    title,
    viewHref,
  } = useJournalEditor()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="placeholder:text-muted-foreground h-14 overflow-hidden border-0 bg-transparent px-0 py-0 font-serif text-3xl leading-tight font-semibold shadow-none focus-visible:ring-0 md:h-16 md:text-4xl dark:bg-transparent"
          />
          <div className="flex items-center gap-2">
            <Badge variant={hasPersistedDraft ? 'default' : 'secondary'}>
              {hasPersistedDraft ? 'Draft' : 'Published'}
            </Badge>
            {isDirty && <Badge variant="outline">Unsaved changes</Badge>}
            {isEditMode && viewHref && (
              <Button variant="outline" asChild>
                <Link href={viewHref}>View entry</Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={discard}
              disabled={isDiscarding || (!hasPersistedDraft && !isDirty)}
            >
              {isDiscarding ? 'Discarding...' : 'Discard draft'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={isSavingDraft || !isDirty}
            >
              {isSavingDraft ? 'Saving...' : 'Save draft'}
            </Button>
            <Button
              type="button"
              onClick={publish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
            {headerActions}
          </div>
        </div>
        {isEditMode && <Badge variant="secondary">Editing</Badge>}
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default JournalHeader
