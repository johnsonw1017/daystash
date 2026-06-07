'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import {
  deleteJournalImage,
  saveJournalDraft,
} from '@/app/(journal)/write/actions'
import type { JournalEditorProps, ImageJournalBlock } from '@/components/journal-editor/types'
import {
  makeTextBlock,
  normalizeEditorBlocks,
  reindexBlocks,
} from '@/components/journal-editor/utils'
import { journalQueryKeys } from '@/hooks/use-journals'
import supabase from '@/lib/supabase/client'
import { uploadImagesToCloudinary } from '@/lib/image-upload'
import { toast } from 'sonner'

type UseJournalEditorParams = Pick<
  JournalEditorProps,
  'initialBlocks' | 'initialJournalId' | 'initialTitle' | 'successMessage'
>

const useJournalEditor = ({
  initialBlocks,
  initialJournalId,
  initialTitle = '',
  successMessage = 'Journal saved',
}: UseJournalEditorParams) => {
  const queryClient = useQueryClient()
  const journalIdRef = useRef<string | undefined>(initialJournalId)
  const [title, setTitle] = useState(initialTitle)
  const [errorMessage, setErrorMessage] = useState('')
  const [blocks, setBlocks] = useState(
    initialBlocks?.length ? normalizeEditorBlocks(initialBlocks) : [makeTextBlock()]
  )
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const pendingFocusIndexRef = useRef<number | null>(null)
  const textAreaRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const uploadInputId = 'journal-image-upload'

  useEffect(() => {
    if (pendingFocusIndexRef.current === null) return

    const target = textAreaRefs.current[pendingFocusIndexRef.current]
    if (!target) return

    target.focus()
    const length = target.value.length
    target.setSelectionRange(length, length)
    pendingFocusIndexRef.current = null
  }, [blocks])

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

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => deleteJournalImage({ imageId }),
    onError: () => {
      toast.error('Could not delete image')
    },
  })

  const openUploadDialog = (insertBelowIndex: number) => {
    setActiveInsertIndex(insertBelowIndex)
    setPendingFiles([])
    setIsUploadDialogOpen(true)
  }

  const addTextBlockBelow = (index: number) => {
    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      nextBlocks.splice(index + 1, 0, makeTextBlock())
      return reindexBlocks(nextBlocks)
    })
    pendingFocusIndexRef.current = index + 1
  }

  const updateTextBlock = (index: number, value: string) => {
    setBlocks((currentBlocks) => {
      const block = currentBlocks[index]
      if (!block || block.type !== 'text') return currentBlocks
      const nextBlocks = [...currentBlocks]
      nextBlocks[index] = { ...block, text_content: value }
      return nextBlocks
    })
  }

  const removeTextBlock = (index: number) => {
    setBlocks((currentBlocks) =>
      reindexBlocks(currentBlocks.filter((_, blockIndex) => blockIndex !== index))
    )
  }

  const updateImageCaption = (index: number, value: string) => {
    setBlocks((currentBlocks) => {
      const block = currentBlocks[index]
      if (!block || block.type !== 'image') return currentBlocks
      const nextBlocks = [...currentBlocks]
      nextBlocks[index] = { ...block, caption: value }
      return nextBlocks
    })
  }

  const uploadImages = async () => {
    if (activeInsertIndex === null || pendingFiles.length === 0) return

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

        nextBlocks.splice(activeInsertIndex + 1, 0, imageBlock)
        return reindexBlocks(nextBlocks)
      })

      setPendingFiles([])
      setIsUploadDialogOpen(false)
      setActiveInsertIndex(null)
      toast.success('Image block added')
    } catch {
      toast.error('Image upload failed')
    }
  }

  const removeImage = async (blockIndex: number, imageIndex: number) => {
    const block = blocks[blockIndex]
    if (!block || block.type !== 'image') return

    const imageToRemove = block.images[imageIndex]
    if (!imageToRemove) return

    if (imageToRemove.id) {
      await deleteImageMutation.mutateAsync(imageToRemove.id)
    }

    setBlocks((currentBlocks) => {
      const currentBlock = currentBlocks[blockIndex]
      if (!currentBlock || currentBlock.type !== 'image') return currentBlocks

      const nextImages = currentBlock.images
        .filter((_, currentImageIndex) => currentImageIndex !== imageIndex)
        .map((image, currentImageIndex) => ({
          ...image,
          position: currentImageIndex,
        }))

      if (!nextImages.length) {
        const nextBlocks = [...currentBlocks]
        nextBlocks.splice(blockIndex, 1)
        return reindexBlocks(nextBlocks)
      }

      const nextBlocks = [...currentBlocks]
      nextBlocks[blockIndex] = {
        ...currentBlock,
        images: nextImages,
      }
      return nextBlocks
    })
  }

  const handleUploadDialogOpenChange = (open: boolean) => {
    setIsUploadDialogOpen(open)
    if (!open) {
      setPendingFiles([])
      setActiveInsertIndex(null)
    }
  }

  const save = () => {
    setErrorMessage('')
    saveMutation.mutate(blocks)
  }

  return {
    actions: {
      addTextBlockBelow,
      handleUploadDialogOpenChange,
      openUploadDialog,
      removeImage,
      removeTextBlock,
      save,
      setPendingFiles,
      setTitle,
      updateImageCaption,
      updateTextBlock,
      uploadImages,
    },
    blocks,
    errorMessage,
    isUploadDialogOpen,
    pendingFiles,
    saveMutation,
    textAreaRefs,
    title,
    uploadInputId,
  }
}

export default useJournalEditor
