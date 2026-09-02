'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
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

type RegenerateSlugActionProps = {
  slug: string
}

const RegenerateSlugAction = ({ slug }: RegenerateSlugActionProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isRegeneratingSlug, isSaving, regenerateSlug, title } =
    useJournalEditor()
  const slugIsCurrent = isJournalSlugCurrent(title, slug)

  const handleRegenerate = async () => {
    try {
      const result = await regenerateSlug()

      setIsOpen(false)
      queryClient.removeQueries({
        queryKey: journalQueryKeys.bySlug(slug),
        exact: true,
      })
      router.replace(`/entries/${encodeURIComponent(result.slug)}/edit`)
    } catch {
      // The editor hook owns the visible error state and toast.
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isRegeneratingSlug) setIsOpen(open)
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
          disabled={slugIsCurrent || isSaving}
        >
          <RefreshCw className="size-5 lg:size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate this journal URL?</DialogTitle>
          <DialogDescription>
            Your current changes will be saved before the URL changes. The old
            journal URL will no longer work.
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
            disabled={isRegeneratingSlug}
            onClick={handleRegenerate}
          >
            {isRegeneratingSlug ? 'Saving and regenerating…' : 'Regenerate URL'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RegenerateSlugAction
