'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { deleteJournal } from '@/app/(journal)/write/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { journalQueryKeys } from '@/hooks/use-journals'
import { toast } from 'sonner'

type DeleteJournalButtonProps = {
  journalId: string
  slug: string
}

const DeleteJournalButton = ({ journalId, slug }: DeleteJournalButtonProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: () => deleteJournal({ journalId }),
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive size-11 lg:size-9"
          aria-label="Delete journal"
        >
          <Trash2 className="size-5 lg:size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this journal?</DialogTitle>
          <DialogDescription>
            Permanently delete will remove this journal from Supabase and cannot
            be undone.
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
            {deleteMutation.isPending ? 'Deleting...' : 'Permanently delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteJournalButton
