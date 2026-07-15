'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { deleteJournal } from '@/app/(journal)/write/actions'
import { Button } from '@/components/ui/button'
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import JournalEditor from '@/components/journal-editor'
import { journalQueryKeys, useJournalBySlug } from '@/hooks/use-journals'
import { toast } from 'sonner'

type EntryEditProps = {
  slug: string
}

const EntryEdit = ({ slug }: EntryEditProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: journal, isLoading } = useJournalBySlug(slug)
  const deleteMutation = useMutation({
    mutationFn: async () => deleteJournal({ journalId: journal!.id }),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: journalQueryKeys.bySlug(slug) })
      await queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success('Journal deleted')
      router.push('/dashboard')
    },
    onError: () => {
      toast.error('Could not delete journal')
    },
  })

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
      initialBlocks={journal.blocks}
      successMessage="Journal saved"
      isEditMode
      viewHref={`/entries/${slug}`}
      headerActions={
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              aria-label="Delete journal"
            >
              <Trash2 />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this journal?</DialogTitle>
              <DialogDescription>
                Permanently delete will remove this journal from Supabase and
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending
                  ? 'Deleting...'
                  : 'Permanently delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    />
  )
}

export default EntryEdit
