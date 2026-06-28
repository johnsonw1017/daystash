'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { saveJournal } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  errorMessageAtom,
  journalEditorConfigAtom,
  journalIdAtom,
  lastSavedTitleAtom,
  pendingTextSelectionAtom,
  savedBlocksAtom,
  sessionAssetIdsAtom,
  textAreaRefsAtom,
  titleAtom,
} from '@/components/journal-editor/atoms'
import { makeImageBlock, makeTextBlock, normalizeEditorBlocks } from '@/components/journal-editor/utils'
import { journalQueryKeys } from '@/hooks/use-journals'
import type { JournalBlock } from '@/lib/journals'
import { toast } from 'sonner'

const ensureEditorHasBlock = (blocks: JournalBlock[]) =>
  blocks.length ? blocks : [makeTextBlock()]

type InsertBlockType = JournalBlock['type']
type InsertBlockOptions = {
  images?: Parameters<typeof makeImageBlock>[0]
}
type MergeTextBlockDirection = 'previous' | 'next'

const useJournalEditor = () => {
  const queryClient = useQueryClient()
  const [blocks, setBlocks] = useAtom(blocksAtom)
  const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom)
  const [editorConfig] = useAtom(journalEditorConfigAtom)
  const [journalId, setJournalId] = useAtom(journalIdAtom)
  const [lastSavedTitle, setLastSavedTitle] = useAtom(lastSavedTitleAtom)
  const [pendingTextSelection, setPendingTextSelection] = useAtom(
    pendingTextSelectionAtom
  )
  const [savedBlocks, setSavedBlocks] = useAtom(savedBlocksAtom)
  const [sessionAssetIds, setSessionAssetIds] = useAtom(sessionAssetIdsAtom)
  const [textAreaRefs] = useAtom(textAreaRefsAtom)
  const setTextAreaRefs = useSetAtom(textAreaRefsAtom)
  const [title, setTitle] = useAtom(titleAtom)
  const latestJournalIdRef = useRef(journalId)
  const latestIsDirtyRef = useRef(false)
  const latestSessionAssetIdsRef = useRef<string[]>([])
  const cleanupSentRef = useRef(false)
  const isSavingRef = useRef(false)

  const normalizedBlocks = normalizeEditorBlocks(blocks)
  const isDirty =
    JSON.stringify(normalizedBlocks) !== JSON.stringify(savedBlocks) ||
    title !== lastSavedTitle

  const applySavedState = useCallback(
    ({
      blocks: nextBlocks,
      nextJournalId,
      successMessage,
    }: {
      blocks: JournalBlock[]
      nextJournalId?: string
      successMessage: string
    }) => {
      if (nextJournalId) {
        setJournalId(nextJournalId)
        latestJournalIdRef.current = nextJournalId
      }

      setBlocks(nextBlocks)
      setSavedBlocks(nextBlocks)
      setLastSavedTitle(title)
      setSessionAssetIds([])
      latestIsDirtyRef.current = false
      latestSessionAssetIdsRef.current = []
      cleanupSentRef.current = false
      isSavingRef.current = false

      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success(successMessage)
    },
    [
      queryClient,
      setBlocks,
      setJournalId,
      setLastSavedTitle,
      setSavedBlocks,
      setSessionAssetIds,
      title,
    ]
  )

  const handleMutationError = useCallback(
    ({
      message,
      toastMessage,
    }: {
      message: string
      toastMessage: string
    }) => {
      setErrorMessage(message)
      toast.error(toastMessage)
    },
    [setErrorMessage]
  )

  const runMutation = useCallback((callback: () => void) => {
    setErrorMessage('')
    callback()
  }, [setErrorMessage])

  useEffect(() => {
    latestJournalIdRef.current = journalId
    latestIsDirtyRef.current = isDirty
    latestSessionAssetIdsRef.current = sessionAssetIds
    cleanupSentRef.current = false
  }, [isDirty, journalId, sessionAssetIds])

  const discardSessionChanges = useCallback(() => {
    if (cleanupSentRef.current) return
    if (isSavingRef.current) return

    const nextJournalId = latestJournalIdRef.current
    const nextSessionAssetIds = latestSessionAssetIdsRef.current

    if (!nextJournalId) return
    if (!latestIsDirtyRef.current && nextSessionAssetIds.length === 0) return

    cleanupSentRef.current = true

    const payload = JSON.stringify({
      journalId: nextJournalId,
      sessionAssetIds: nextSessionAssetIds,
    })

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/journals/discard-session',
        new Blob([payload], { type: 'application/json' })
      )
      return
    }

    void fetch('/api/journals/discard-session', {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
    })
  }, [])

  useEffect(() => {
    const handlePageHide = () => {
      discardSessionChanges()
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [discardSessionChanges])

  useEffect(
    () => () => {
      discardSessionChanges()
    },
    [discardSessionChanges]
  )

  useEffect(() => {
    if (pendingTextSelection === null) return

    const target = textAreaRefs[pendingTextSelection.blockId]
    if (!target) return

    target.focus()
    target.setSelectionRange(pendingTextSelection.start, pendingTextSelection.end)
    setPendingTextSelection(null)
  }, [blocks, pendingTextSelection, setPendingTextSelection, textAreaRefs])

  const focusTextBlock = useCallback(
    (blockId: string, start: number, end = start) => {
      setPendingTextSelection({ blockId, start, end })
    },
    [setPendingTextSelection]
  )

  const setTextareaRef = useCallback(
    (blockId: string, node: HTMLTextAreaElement | null) => {
      setTextAreaRefs((currentRefs) => {
        if (currentRefs[blockId] === node) return currentRefs

        if (!node && !(blockId in currentRefs)) return currentRefs

        const nextRefs = { ...currentRefs }

        if (node) {
          nextRefs[blockId] = node
        } else {
          delete nextRefs[blockId]
        }

        return nextRefs
      })
    },
    [setTextAreaRefs]
  )

  const insertBlockBelow = useCallback(
    (
      blockId: string,
      blockType: InsertBlockType,
      options?: InsertBlockOptions
    ) => {
      const nextBlock =
        blockType === 'image'
          ? makeImageBlock(options?.images ?? [])
          : makeTextBlock()

      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        if (blockIndex === -1) return currentBlocks

        const nextBlocks =
          blockType !== 'text' &&
          currentBlocks.length === 1 &&
          currentBlocks[0]?.type === 'text' &&
          currentBlocks[0].content.trim().length === 0
            ? []
            : [...currentBlocks]

        nextBlocks.splice(blockIndex + 1, 0, nextBlock)
        return nextBlocks
      })

      if (blockType === 'text') {
        focusTextBlock(nextBlock.id, 0)
      }
    },
    [focusTextBlock, setBlocks]
  )

  const insertImagesBelow = useCallback(
    (blockId: string, images: NonNullable<InsertBlockOptions['images']>) => {
      const blockExists = blocks.some((block) => block.id === blockId)
      if (!blockExists) return null

      const nextBlock = makeImageBlock(images)

      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        if (blockIndex === -1) return currentBlocks

        const nextBlocks =
          currentBlocks.length === 1 &&
          currentBlocks[0]?.type === 'text' &&
          currentBlocks[0].content.trim().length === 0
            ? []
            : [...currentBlocks]

        nextBlocks.splice(blockIndex + 1, 0, nextBlock)
        return nextBlocks
      })

      return nextBlock.id
    },
    [blocks, setBlocks]
  )

  const appendImagesToBlock = useCallback(
    (blockId: string, images: NonNullable<InsertBlockOptions['images']>) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'image') return currentBlocks

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = {
          ...block,
          images: [
            ...block.images,
            ...images.map((image) => ({
              ...image,
              altText: image.altText ?? null,
            })),
          ],
        }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const splitTextBlock = useCallback(
    (blockId: string, start: number, end: number) => {
      const nextBlock = makeTextBlock()

      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        const block = currentBlocks[blockIndex]

        if (block?.type !== 'text') return currentBlocks

        const before = block.content.slice(0, start)
        const after = block.content.slice(end)

        return [
          ...currentBlocks.slice(0, blockIndex),
          { ...block, content: before },
          { ...nextBlock, content: after },
          ...currentBlocks.slice(blockIndex + 1),
        ]
      })

      focusTextBlock(nextBlock.id, 0)
    },
    [focusTextBlock, setBlocks]
  )

  const updateTextBlock = useCallback(
    (blockId: string, value: string) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'text') return currentBlocks

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, content: value }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const updateImageCaption = useCallback(
    (blockId: string, value: string) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'image') return currentBlocks

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, caption: value }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const removeBlock = useCallback(
    (blockId: string) => {
      setBlocks((currentBlocks) =>
        ensureEditorHasBlock(currentBlocks.filter((block) => block.id !== blockId))
      )
    },
    [setBlocks]
  )

  const mergeTextBlock = useCallback(
    (blockId: string, direction: MergeTextBlockDirection) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        const sourceIndex = direction === 'previous' ? blockIndex - 1 : blockIndex
        const targetIndex = direction === 'previous' ? blockIndex : blockIndex + 1
        const sourceBlock = currentBlocks[sourceIndex]
        const targetBlock = currentBlocks[targetIndex]

        if (sourceBlock?.type !== 'text' || targetBlock?.type !== 'text') {
          return currentBlocks
        }

        return [
          ...currentBlocks.slice(0, sourceIndex),
          {
            ...sourceBlock,
            content: sourceBlock.content + targetBlock.content,
          },
          ...currentBlocks.slice(targetIndex + 1),
        ]
      })
    },
    [setBlocks]
  )

  const removeImage = useCallback(
    (blockId: string, imageIndex: number) => {
      setBlocks((currentBlocks) => {
        const currentBlockIndex = currentBlocks.findIndex(
          (candidate) => candidate.id === blockId
        )
        const currentBlock = currentBlocks[currentBlockIndex]

        if (!currentBlock || currentBlock.type !== 'image') return currentBlocks

        const nextImages = currentBlock.images.filter(
          (_, currentImageIndex) => currentImageIndex !== imageIndex
        )

        if (!nextImages.length) {
          return ensureEditorHasBlock(
            currentBlocks.filter((candidate) => candidate.id !== blockId)
          )
        }

        const nextBlocks = [...currentBlocks]
        nextBlocks[currentBlockIndex] = {
          ...currentBlock,
          images: nextImages,
        }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const moveBlock = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return

      setBlocks((currentBlocks) => {
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= currentBlocks.length ||
          toIndex >= currentBlocks.length
        ) {
          return currentBlocks
        }

        const nextBlocks = [...currentBlocks]
        const [movedBlock] = nextBlocks.splice(fromIndex, 1)

        if (!movedBlock) return currentBlocks

        nextBlocks.splice(toIndex, 0, movedBlock)
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const saveMutation = useMutation({
    mutationFn: async () =>
      saveJournal({
        journalId,
        title,
        blocks: normalizedBlocks,
      }),
    onSuccess: (response) =>
      applySavedState({
        blocks: response.blocks,
        nextJournalId: response.journalId,
        successMessage: editorConfig.successMessage,
      }),
    onError: () => {
      isSavingRef.current = false
      handleMutationError({
        message: 'Could not save changes. Try again.',
        toastMessage: 'Could not save journal',
      })
    },
  })

  const save = () =>
    runMutation(() => {
      isSavingRef.current = true
      saveMutation.mutate()
    })

  return {
    appendImagesToBlock,
    blocks,
    errorMessage,
    focusTextBlock,
    headerActions: editorConfig.headerActions,
    insertBlockBelow,
    insertImagesBelow,
    isDirty,
    isEditMode: editorConfig.isEditMode ?? false,
    isSaving: saveMutation.isPending,
    mergeTextBlock,
    moveBlock,
    save,
    removeBlock,
    removeImage,
    setTextareaRef,
    setTitle,
    splitTextBlock,
    title,
    updateImageCaption,
    updateTextBlock,
    viewHref: editorConfig.viewHref,
  }
}

export default useJournalEditor
