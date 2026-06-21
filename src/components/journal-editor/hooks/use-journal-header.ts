'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { saveJournalDraft } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  errorMessageAtom,
  journalEditorConfigAtom,
  journalIdAtom,
  titleAtom,
} from '@/components/journal-editor/atoms'
import { normalizeEditorBlocks } from '@/components/journal-editor/utils'
import { journalQueryKeys } from '@/hooks/use-journals'
import { toast } from 'sonner'

const useJournalHeader = () => {
  const queryClient = useQueryClient()
  const [blocks] = useAtom(blocksAtom)
  const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom)
  const [editorConfig] = useAtom(journalEditorConfigAtom)
  const [journalId, setJournalId] = useAtom(journalIdAtom)
  const [title, setTitle] = useAtom(titleAtom)

  const saveMutation = useMutation({
    mutationFn: async () =>
      saveJournalDraft({
        journalId,
        title,
        blocks: normalizeEditorBlocks(blocks),
      }),
    onSuccess: (response) => {
      setJournalId(response.journalId)
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success(editorConfig.successMessage)
    },
    onError: () => {
      setErrorMessage('Could not save. Try again.')
      toast.error('Could not save journal')
    },
  })

  const save = () => {
    setErrorMessage('')
    saveMutation.mutate()
  }

  return {
    errorMessage,
    headerActions: editorConfig.headerActions,
    isEditMode: editorConfig.isEditMode ?? false,
    isSaving: saveMutation.isPending,
    save,
    setTitle,
    title,
    viewHref: editorConfig.viewHref,
  }
}

export default useJournalHeader
