'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import { registerJournalAssets } from '@/app/(journal)/write/actions'
import {
  editorSessionIdAtom,
  imageDialogStateAtom,
  journalIdAtom,
  sessionAssetIdsAtom,
  titleAtom,
} from '@/components/journal-editor/atoms'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'
import type { ImageDialogState } from '@/components/journal-editor/types'
import { uploadImagesToCloudinary } from '@/lib/image-upload'
import { MAX_IMAGE_BLOCK_IMAGES } from '@/lib/journal-image-block'
import type { StagedMobileUploadImage } from '@/lib/mobile-upload'
import supabase from '@/lib/supabase/client'

const uploadInputId = 'journal-image-upload'

const closedImageDialogState: ImageDialogState = {
  isOpen: false,
  insertBelowBlockId: '',
  targetBlockId: null,
  mobileSession: null,
  mode: 'device',
  pendingFiles: [],
}

const useImageDialog = () => {
  const [dialogState, setDialogState] = useAtom(imageDialogStateAtom)
  const [editorSessionId] = useAtom(editorSessionIdAtom)
  const [journalId, setJournalId] = useAtom(journalIdAtom)
  const [, setSessionAssetIds] = useAtom(sessionAssetIdsAtom)
  const [title] = useAtom(titleAtom)
  const { appendImagesToBlock, blocks, insertImagesBelow } = useJournalEditor()
  const [isCreatingMobileSession, setIsCreatingMobileSession] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const consumeInFlightRef = useRef(false)
  const pollingStoppedRef = useRef(false)

  const releaseStagedImages = useCallback(async (imageIds: string[], token: string) => {
    if (!imageIds.length) return

    const response = await fetch('/api/mobile-upload/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        imageIds,
      }),
    })

    if (!response.ok) {
      throw new Error('Could not release staged images')
    }
  }, [])

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

  const getRemainingImageSlots = useCallback(
    (context: ImageDialogState) => {
      if (!context.targetBlockId) {
        return MAX_IMAGE_BLOCK_IMAGES
      }

      const targetBlock = blocks.find((block) => block.id === context.targetBlockId)

      if (!targetBlock || targetBlock.type !== 'image') {
        return MAX_IMAGE_BLOCK_IMAGES
      }

      return Math.max(0, MAX_IMAGE_BLOCK_IMAGES - targetBlock.images.length)
    },
    [blocks]
  )

  const setPendingFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))

    updateImageUploadContext((context) => ({
      ...context,
      pendingFiles: imageFiles.slice(0, getRemainingImageSlots(context)),
    }))

    const remainingSlots = getRemainingImageSlots(dialogState)

    if (remainingSlots === 0) {
      toast.error(`You can only keep ${MAX_IMAGE_BLOCK_IMAGES} images in one carousel`)
      return
    }

    if (imageFiles.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added`)
    }
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
      pollingStoppedRef.current = false

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
    const remainingSlots = getRemainingImageSlots(dialogState)

    if (pendingFiles.length === 0) return
    if (remainingSlots === 0) {
      toast.error(`You can only keep ${MAX_IMAGE_BLOCK_IMAGES} images in one carousel`)
      return
    }

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
      const uploadedImages = await uploadImagesToCloudinary(
        pendingFiles.slice(0, remainingSlots),
        user.id
      )
      const registeredAssets = await registerJournalAssets({
        journalId,
        title,
        assets: uploadedImages.map((image) => ({
          publicId: image.publicId,
          width: image.width,
          height: image.height,
        })),
      })

      setJournalId(registeredAssets.journalId)
      setSessionAssetIds((currentAssetIds) => [
        ...currentAssetIds,
        ...registeredAssets.assets.map((asset) => asset.assetId),
      ])

      if (dialogState.targetBlockId) {
        appendImagesToBlock(dialogState.targetBlockId, registeredAssets.assets)
      } else {
        insertImagesBelow(insertBelowBlockId, registeredAssets.assets)
      }

      closeDialog()
      toast.success(dialogState.targetBlockId ? 'Images added' : 'Image block added')
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

    pollingStoppedRef.current = false

    const consumeStagedImages = async () => {
      if (consumeInFlightRef.current || pollingStoppedRef.current) return

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
          if (response.status === 401) {
            pollingStoppedRef.current = true
            toast.error('Phone upload ended. Please log in again.')
            return
          }

          if (response.status === 404) {
            pollingStoppedRef.current = true
            toast.error('Phone upload session expired. Start a new QR session.')
            return
          }

          throw new Error('Could not consume staged images')
        }

        const payload = (await response.json()) as {
          images: StagedMobileUploadImage[]
        }

        if (!payload.images.length) return

        const remainingSlots = getRemainingImageSlots(dialogState)

        if (remainingSlots === 0) {
          await releaseStagedImages(
            payload.images.map((image) => image.id),
            token
          )
          pollingStoppedRef.current = true
          toast.error(`You can only keep ${MAX_IMAGE_BLOCK_IMAGES} images in one carousel`)
          return
        }

        const imagesToRegister = payload.images.slice(0, remainingSlots)
        const imagesToRelease = payload.images.slice(remainingSlots)

        let registeredAssets: Awaited<ReturnType<typeof registerJournalAssets>>

        try {
          registeredAssets = await registerJournalAssets({
            journalId,
            title,
            assets: imagesToRegister.map((image) => ({
              publicId: image.publicId,
              width: image.width,
              height: image.height,
            })),
          })
        } catch {
          await releaseStagedImages(
            imagesToRegister.map((image) => image.id),
            token
          )
          throw new Error('Could not register staged images')
        }

        if (imagesToRelease.length > 0) {
          await releaseStagedImages(
            imagesToRelease.map((image) => image.id),
            token
          )
          pollingStoppedRef.current = true
          toast.error(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} could be added`)
        }

        setJournalId(registeredAssets.journalId)
        setSessionAssetIds((currentAssetIds) => [
          ...currentAssetIds,
          ...registeredAssets.assets.map((asset) => asset.assetId),
        ])

        const nextImages = registeredAssets.assets

        const targetBlockId = dialogState.targetBlockId

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
          targetBlockId: insertedBlockId,
        }))
      } catch {
        pollingStoppedRef.current = true
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
    journalId,
    getRemainingImageSlots,
    setJournalId,
    setSessionAssetIds,
    title,
    updateImageUploadContext,
    releaseStagedImages,
  ])

  return {
    closeDialog,
    dialogState,
    isCreatingMobileSession,
    isUploadingImages,
    remainingImageSlots: getRemainingImageSlots(dialogState),
    setPendingFiles,
    setUploadMode,
    uploadImages,
    uploadInputId,
  }
}

export default useImageDialog
