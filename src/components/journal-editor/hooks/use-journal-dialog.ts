'use client'

import { v4 as uuidv4 } from 'uuid'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import {
  blocksAtom,
  editorDialogStateAtom,
} from '@/components/journal-editor/atoms'
import type { ImageJournalBlock } from '@/components/journal-editor/types'
import { reindexBlocks } from '@/components/journal-editor/utils'
import { uploadImagesToCloudinary } from '@/lib/image-upload'
import supabase from '@/lib/supabase/client'

const uploadInputId = 'journal-image-upload'

const useJournalDialog = () => {
  const [, setBlocks] = useAtom(blocksAtom)
  const [dialogState, setDialogState] = useAtom(editorDialogStateAtom)

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

    const { insertBelowIndex, pendingFiles } = dialogState.context

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

      setBlocks((currentBlocks) => {
        const nextBlocks =
          currentBlocks.length === 1 &&
          currentBlocks[0]?.type === 'text' &&
          currentBlocks[0].text_content.trim().length === 0
            ? []
            : [...currentBlocks]

        const imageBlock: ImageJournalBlock = {
          id: uuidv4(),
          type: 'image',
          position: 0,
          caption: '',
          images: uploadedImages.map((image, imageIndex) => ({
            ...image,
            position: imageIndex,
            alt_text: null,
          })),
        }

        nextBlocks.splice(insertBelowIndex + 1, 0, imageBlock)
        return reindexBlocks(nextBlocks)
      })

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
