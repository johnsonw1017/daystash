'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import {
  editorSessionIdAtom,
  imageDialogStateAtom,
} from '@/components/journal-editor/atoms'
import useJournalBlocks from '@/components/journal-editor/hooks/use-journal-blocks'
import type { ImageDialogState } from '@/components/journal-editor/types'
import { uploadImagesToCloudinary } from '@/lib/image-upload'
import type { StagedMobileUploadImage } from '@/lib/mobile-upload'
import supabase from '@/lib/supabase/client'

const uploadInputId = 'journal-image-upload'

const closedImageDialogState: ImageDialogState = {
  isOpen: false,
  insertBelowBlockId: '',
  mobileTargetBlockId: null,
  mobileSession: null,
  mode: 'device',
  pendingFiles: [],
}

const useImageDialog = () => {
  const [dialogState, setDialogState] = useAtom(imageDialogStateAtom)
  const [editorSessionId] = useAtom(editorSessionIdAtom)
  const { appendImagesToBlock, insertImagesBelow } = useJournalBlocks()
  const [isCreatingMobileSession, setIsCreatingMobileSession] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const consumeInFlightRef = useRef(false)

  const updateImageUploadContext = useCallback(
    (updater: (context: ImageDialogState) => ImageDialogState) => {
      setDialogState((currentState) => {
        if (!currentState.isOpen) {
          return currentState
        }

        return updater(currentState)
      })
    },
    [setDialogState]
  )

  const closeDialog = () => {
    setDialogState(closedImageDialogState)
  }

  const setPendingFiles = (files: File[]) => {
    updateImageUploadContext((context) => ({
      ...context,
      pendingFiles: files,
    }))
  }

  const setUploadMode = async (mode: ImageDialogState['mode']) => {
    if (!dialogState.isOpen) return

    updateImageUploadContext((context) => ({
      ...context,
      mode,
    }))

    if (
      mode !== 'phone' ||
      dialogState.mobileSession ||
      isCreatingMobileSession
    ) {
      return
    }

    setIsCreatingMobileSession(true)

    try {
      const response = await fetch('/api/mobile-upload/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          editorSessionId,
          insertAfterBlockClientId: dialogState.insertBelowBlockId,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not create mobile upload session')
      }

      const payload = (await response.json()) as {
        expiresAt: string
        token: string
      }

      updateImageUploadContext((context) => ({
        ...context,
        mobileSession: payload,
      }))
    } catch {
      toast.error('Could not start phone upload')
    } finally {
      setIsCreatingMobileSession(false)
    }
  }

  const uploadImages = async () => {
    if (!dialogState.isOpen) return

    const { insertBelowBlockId, pendingFiles } = dialogState

    if (pendingFiles.length === 0) return

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      toast.error('Please log in again to upload images')
      return
    }

    setIsUploadingImages(true)

    try {
      const uploadedImages = await uploadImagesToCloudinary(pendingFiles, user.id)

      insertImagesBelow(insertBelowBlockId, uploadedImages)

      closeDialog()
      toast.success('Image block added')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setIsUploadingImages(false)
    }
  }

  useEffect(() => {
    if (!dialogState.isOpen) return
    if (dialogState.mode !== 'phone') return

    const token = dialogState.mobileSession?.token
    if (!token) return

    const consumeStagedImages = async () => {
      if (consumeInFlightRef.current) return

      consumeInFlightRef.current = true

      try {
        const response = await fetch('/api/mobile-upload/consume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error('Could not consume staged images')
        }

        const payload = (await response.json()) as {
          images: StagedMobileUploadImage[]
        }

        if (!payload.images.length) return

        const nextImages = payload.images.map((image) => ({
          cloudinary_public_id: image.cloudinary_public_id,
          width: image.width,
          height: image.height,
          alt_text: image.alt_text,
        }))

        const targetBlockId = dialogState.mobileTargetBlockId

        if (targetBlockId) {
          appendImagesToBlock(targetBlockId, nextImages)
          return
        }

        const insertedBlockId = insertImagesBelow(
          dialogState.insertBelowBlockId,
          nextImages
        )

        if (!insertedBlockId) return

        updateImageUploadContext((context) => ({
          ...context,
          mobileTargetBlockId: insertedBlockId,
        }))
      } catch {
        toast.error('Phone upload sync stopped')
      } finally {
        consumeInFlightRef.current = false
      }
    }

    void consumeStagedImages()

    const intervalId = window.setInterval(() => {
      void consumeStagedImages()
    }, 2000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    appendImagesToBlock,
    dialogState,
    insertImagesBelow,
    updateImageUploadContext,
  ])

  return {
    closeDialog,
    dialogState,
    isCreatingMobileSession,
    isUploadingImages,
    setPendingFiles,
    setUploadMode,
    uploadImages,
    uploadInputId,
  }
}

export default useImageDialog
