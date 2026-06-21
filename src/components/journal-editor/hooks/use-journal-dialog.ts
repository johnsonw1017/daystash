'use client'

import { useAtom } from 'jotai'
import { toast } from 'sonner'
import { editorDialogStateAtom } from '@/components/journal-editor/atoms'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
import { uploadImagesToCloudinary } from '@/lib/image-upload'
import supabase from '@/lib/supabase/client'

const uploadInputId = 'journal-image-upload'

const useJournalDialog = () => {
  const [dialogState, setDialogState] = useAtom(editorDialogStateAtom)
  const { insertBlockBelow } = useJournalBlocks()

  const closeDialog = () => {
    setDialogState({
      type: null,
      isOpen: false,
      context: null,
    })
  }

  const setPendingFiles = (files: File[]) => {
    setDialogState((currentState) => {
      if (!currentState.isOpen || currentState.type !== 'image-upload') {
        return currentState
      }

      return {
        ...currentState,
        context: {
          ...currentState.context,
          pendingFiles: files,
        },
      }
    })
  }

  const uploadImages = async () => {
    if (!dialogState.isOpen || dialogState.type !== 'image-upload') return

    const { insertBelowBlockId, pendingFiles } = dialogState.context

    if (pendingFiles.length === 0) return

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      toast.error('Please log in again to upload images')
      return
    }

    try {
      const uploadedImages = await uploadImagesToCloudinary(
        pendingFiles,
        user.id
      )

      insertBlockBelow(insertBelowBlockId, 'image', { images: uploadedImages })

      closeDialog()
      toast.success('Image block added')
    } catch {
      toast.error('Image upload failed')
    }
  }

  return {
    closeDialog,
    dialogState,
    setPendingFiles,
    uploadImages,
    uploadInputId,
  }
}

export default useJournalDialog
