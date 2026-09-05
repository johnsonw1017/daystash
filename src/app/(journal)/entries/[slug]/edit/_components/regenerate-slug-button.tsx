'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, RefreshCw } from 'lucide-react'
import { regenerateJournalSlug } from '@/app/(journal)/write/actions'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
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
import { isJournalSlugCurrent } from '@/lib/journals'
import { toast } from 'sonner'

type RegenerateSlugButtonProps = {
  journalId: string
  slug: string
}

const RegenerateSlugButton = ({
  journalId,
  slug,
}: RegenerateSlugButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isDirty, isSaving, save, title } = useJournalEditor()
  const slugIsCurrent = isJournalSlugCurrent(title, slug)
  const regenerateMutation = useMutation({
    mutationFn: () => regenerateJournalSlug({ journalId }),
    onSuccess: (result) => {
      setIsOpen(false)
      queryClient.removeQueries({
        queryKey: journalQueryKeys.bySlug(slug),
        exact: true,
      })
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success('Journal URL regenerated')
      router.replace(`/entries/${encodeURIComponent(result.slug)}/edit`)
    },
    onError: () => {
      toast.error('Could not regenerate journal URL')
    },
  })
  const isPending = isSaving || regenerateMutation.isPending

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) setIsOpen(open)
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 lg:size-9"
          aria-label="Regenerate journal URL"
          title={
            slugIsCurrent
              ? 'The journal URL already matches its title'
              : 'Regenerate journal URL'
          }
          disabled={slugIsCurrent || isPending}
        >
          <span className="flex flex-col items-center" aria-hidden="true">
            <Link2 className="size-3 stroke-[2.5]" />
            <RefreshCw className="size-4" />
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        {isDirty ? (
          <>
            <DialogHeader>
              <DialogTitle>Save changes first</DialogTitle>
              <DialogDescription>
                This journal has unsaved changes. Save them before regenerating
                the journal URL.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" disabled={isSaving} onClick={save}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </>
        ) : slugIsCurrent ? (
          <>
            <DialogHeader>
              <DialogTitle>Journal URL is already current</DialogTitle>
              <DialogDescription>
                The journal URL already matches the saved title and does not
                need to be regenerated.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Regenerate this journal URL?</DialogTitle>
              <DialogDescription>
                The old journal URL will no longer work.
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
                disabled={isPending}
                onClick={() => regenerateMutation.mutate()}
              >
                {regenerateMutation.isPending
                  ? 'Regenerating…'
                  : 'Regenerate URL'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RegenerateSlugButton
