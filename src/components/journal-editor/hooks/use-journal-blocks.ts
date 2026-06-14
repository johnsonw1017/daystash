'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import type { Store } from 'jotai/vanilla/store'
import { v4 as uuidv4 } from 'uuid'
import { saveJournalDraft } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  pendingFocusIndexAtom,
  textAreaRefsAtom,
  uploadDialogStateAtom,
} from '@/components/journal-editor/atoms'
import type { JournalEditorProps, ImageJournalBlock } from '@/components/journal-editor/types'
import { normalizeEditorBlocks, reindexBlocks } from '@/components/journal-editor/utils'
import { journalQueryKeys } from '@/hooks/use-journals'
import supabase from '@/lib/supabase/client'
import { toast } from 'sonner'
import { uploadImagesToCloudinary } from '@/lib/image-upload'

type UseJournalBlocksParams = Pick<
  JournalEditorProps,
  'initialJournalId' | 'initialTitle' | 'successMessage'
> & {
  store: Store
}

const useJournalBlocks = ({
  initialJournalId,
  initialTitle = '',
  successMessage = 'Journal saved',
  store,
}: UseJournalBlocksParams) => {
  const queryClient = useQueryClient()
  const journalIdRef = useRef<string | undefined>(initialJournalId)
  const [title, setTitle] = useState(initialTitle)
  const [errorMessage, setErrorMessage] = useState('')
  const [blocks, setBlocks] = useAtom(blocksAtom, { store })
  const [pendingFocusIndex, setPendingFocusIndex] = useAtom(pendingFocusIndexAtom, {
    store,
  })
  const [textAreaRefs] = useAtom(textAreaRefsAtom, { store })
  const [uploadDialogState, setUploadDialogState] = useAtom(uploadDialogStateAtom, {
    store,
  })
  const uploadInputId = 'journal-image-upload'

  useEffect(() => {
    if (pendingFocusIndex === null) return

    const target = textAreaRefs[pendingFocusIndex]
    if (!target) return

    target.focus()
    const length = target.value.length
    target.setSelectionRange(length, length)
    setPendingFocusIndex(null)
  }, [blocks, pendingFocusIndex, setPendingFocusIndex, textAreaRefs])

  const saveMutation = useMutation({
    mutationFn: async (inputBlocks: typeof blocks) =>
      saveJournalDraft({
        journalId: journalIdRef.current,
        title,
        blocks: normalizeEditorBlocks(inputBlocks),
      }),
    onSuccess: (response) => {
      journalIdRef.current = response.journalId
      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success(successMessage)
    },
    onError: () => {
      setErrorMessage('Could not save. Try again.')
      toast.error('Could not save journal')
    },
  })

  const openUploadDialog = (insertBelowIndex: number) => {
    setUploadDialogState({
      activeInsertIndex: insertBelowIndex,
      isOpen: true,
      pendingFiles: [],
    })
  }

  const uploadImages = async () => {
    if (
      uploadDialogState.activeInsertIndex === null ||
      uploadDialogState.pendingFiles.length === 0
    ) {
      return
    }

    const insertIndex = uploadDialogState.activeInsertIndex
    const pendingFiles = uploadDialogState.pendingFiles

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      toast.error('Please log in again to upload images')
      return
    }

    try {
      const uploadedImages = await uploadImagesToCloudinary(pendingFiles, user.id)

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

        nextBlocks.splice(insertIndex + 1, 0, imageBlock)
        return reindexBlocks(nextBlocks)
      })

      setUploadDialogState({
        activeInsertIndex: null,
        isOpen: false,
        pendingFiles: [],
      })
      toast.success('Image block added')
    } catch {
      toast.error('Image upload failed')
    }
  }

  const handleUploadDialogOpenChange = (open: boolean) => {
    setUploadDialogState((currentState) => ({
      activeInsertIndex: open ? currentState.activeInsertIndex : null,
      isOpen: open,
      pendingFiles: open ? currentState.pendingFiles : [],
    }))
  }

  const save = () => {
    setErrorMessage('')
    saveMutation.mutate(blocks)
  }

  const setPendingFiles = (files: File[]) => {
    setUploadDialogState((currentState) => ({
      ...currentState,
      pendingFiles: files,
    }))
  }

  return {
    actions: {
      handleUploadDialogOpenChange,
      openUploadDialog,
      save,
      setPendingFiles,
      setTitle,
      uploadImages,
    },
    blocks,
    errorMessage,
    isUploadDialogOpen: uploadDialogState.isOpen,
    pendingFiles: uploadDialogState.pendingFiles,
    saveMutation,
    store,
    title,
    uploadInputId,
  }
}

export default useJournalBlocks
