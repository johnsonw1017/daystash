'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { saveJournal } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  errorMessageAtom,
  isJournalSavingAtom,
  journalEditorConfigAtom,
  journalIdAtom,
  lastSavedTitleAtom,
  savedBlocksAtom,
  sessionAssetIdsAtom,
  titleAtom,
} from '@/components/journal-editor/atoms'
import {
  makeImageBlock,
  makeListBlock,
  makeTextBlock,
  normalizeEditorBlocks,
} from '@/components/journal-editor/utils'
import { journalQueryKeys } from '@/hooks/use-journals'
import type { JournalBlock, ListStyle } from '@/lib/journals'
import useFocusRegistry from '@/components/journal-editor/hooks/use-focus-registry'
import { toast } from 'sonner'

const ensureEditorHasBlock = (blocks: JournalBlock[]) =>
  blocks.length ? blocks : [makeTextBlock()]

type InsertBlockType = JournalBlock['type']
type InsertBlockOptions = {
  images?: Parameters<typeof makeImageBlock>[0]
  listStyle?: ListStyle
}
type MergeTextBlockDirection = 'previous' | 'next'

const useJournalEditor = () => {
  const queryClient = useQueryClient()
  const [blocks, setBlocks] = useAtom(blocksAtom)
  const [errorMessage, setErrorMessage] = useAtom(errorMessageAtom)
  const [editorConfig] = useAtom(journalEditorConfigAtom)
  const [journalId, setJournalId] = useAtom(journalIdAtom)
  const [lastSavedTitle, setLastSavedTitle] = useAtom(lastSavedTitleAtom)
  const [savedBlocks, setSavedBlocks] = useAtom(savedBlocksAtom)
  const setSessionAssetIds = useSetAtom(sessionAssetIdsAtom)
  const setIsJournalSaving = useSetAtom(isJournalSavingAtom)
  const [title, setTitle] = useAtom(titleAtom)
  const { focusBlock, focusTextBlock } = useFocusRegistry()
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
      }

      setBlocks(nextBlocks)
      setSavedBlocks(nextBlocks)
      setLastSavedTitle(title)
      setSessionAssetIds([])
      setIsJournalSaving(false)

      void queryClient.invalidateQueries({ queryKey: journalQueryKeys.all })
      toast.success(successMessage)
    },
    [
      queryClient,
      setBlocks,
      setJournalId,
      setIsJournalSaving,
      setLastSavedTitle,
      setSavedBlocks,
      setSessionAssetIds,
      title,
    ]
  )

  const handleMutationError = useCallback(
    ({ message, toastMessage }: { message: string; toastMessage: string }) => {
      setErrorMessage(message)
      toast.error(toastMessage)
    },
    [setErrorMessage]
  )

  const runMutation = useCallback(
    (callback: () => void) => {
      setErrorMessage('')
      callback()
    },
    [setErrorMessage]
  )

  const focusListItem = useCallback(
    (blockId: string, itemIndex: number, start: number, end = start) => {
      focusTextBlock(`${blockId}:${itemIndex}`, start, end)
    },
    [focusTextBlock]
  )

  const getBlockIndex = useCallback(
    (blockId: string) => blocks.findIndex((block) => block.id === blockId),
    [blocks]
  )

  const getPreviousBlock = useCallback(
    (blockId: string) => {
      const blockIndex = getBlockIndex(blockId)
      return blockIndex > 0 ? blocks[blockIndex - 1] : null
    },
    [blocks, getBlockIndex]
  )

  const getNextBlock = useCallback(
    (blockId: string) => {
      const blockIndex = getBlockIndex(blockId)
      return blockIndex >= 0 ? (blocks[blockIndex + 1] ?? null) : null
    },
    [blocks, getBlockIndex]
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
          : blockType === 'list'
            ? makeListBlock(options?.listStyle ?? 'bullet')
            : makeTextBlock()

      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
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
      } else if (blockType === 'list') {
        focusBlock(nextBlock.id, 'start')
      }
    },
    [focusBlock, focusTextBlock, setBlocks]
  )

  const insertImagesBelow = useCallback(
    (blockId: string, images: NonNullable<InsertBlockOptions['images']>) => {
      const blockExists = blocks.some((block) => block.id === blockId)
      if (!blockExists) return null

      const nextBlock = makeImageBlock(images)

      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
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
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
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
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
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
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
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
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'image') return currentBlocks

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, caption: value }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const updateListItem = useCallback(
    (blockId: string, itemIndex: number, value: string) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'list') return currentBlocks

        if (itemIndex < 0 || itemIndex >= block.items.length)
          return currentBlocks

        const nextItems = [...block.items]
        nextItems[itemIndex] = value

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, items: nextItems }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const updateListStyle = useCallback(
    (blockId: string, style: ListStyle) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'list' || block.style === style) {
          return currentBlocks
        }

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, style }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const splitListItem = useCallback(
    (blockId: string, itemIndex: number, start: number, end: number) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'list') return currentBlocks

        const item = block.items[itemIndex]

        if (typeof item !== 'string') return currentBlocks

        const before = item.slice(0, start)
        const after = item.slice(end)

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = {
          ...block,
          items: [
            ...block.items.slice(0, itemIndex),
            before,
            after,
            ...block.items.slice(itemIndex + 1),
          ],
        }
        return nextBlocks
      })

      return itemIndex + 1
    },
    [setBlocks]
  )

  const mergeListItem = useCallback(
    (
      blockId: string,
      itemIndex: number,
      direction: MergeTextBlockDirection
    ) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'list') return currentBlocks

        const sourceIndex = direction === 'previous' ? itemIndex - 1 : itemIndex
        const targetIndex = direction === 'previous' ? itemIndex : itemIndex + 1
        const sourceItem = block.items[sourceIndex]
        const targetItem = block.items[targetIndex]

        if (typeof sourceItem !== 'string' || typeof targetItem !== 'string') {
          return currentBlocks
        }

        const nextItems = [
          ...block.items.slice(0, sourceIndex),
          sourceItem + targetItem,
          ...block.items.slice(targetIndex + 1),
        ]

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, items: nextItems }
        return nextBlocks
      })
    },
    [setBlocks]
  )

  const convertListBlockToTextBlock = useCallback(
    (blockId: string, itemIndex: number) => {
      const nextTextBlock = makeTextBlock()

      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'list') return currentBlocks

        const item = block.items[itemIndex]

        if (typeof item !== 'string') return currentBlocks

        const nextItems = block.items.filter((_, index) => index !== itemIndex)
        const nextText = { ...nextTextBlock, content: item }

        if (!nextItems.length) {
          return [
            ...currentBlocks.slice(0, blockIndex),
            nextText,
            ...currentBlocks.slice(blockIndex + 1),
          ]
        }

        return [
          ...currentBlocks.slice(0, blockIndex),
          { ...block, items: nextItems },
          nextText,
          ...currentBlocks.slice(blockIndex + 1),
        ]
      })

      return nextTextBlock.id
    },
    [setBlocks]
  )

  const removeBlock = useCallback(
    (blockId: string) => {
      setBlocks((currentBlocks) =>
        ensureEditorHasBlock(
          currentBlocks.filter((block) => block.id !== blockId)
        )
      )
    },
    [setBlocks]
  )

  const mergeTextBlock = useCallback(
    (blockId: string, direction: MergeTextBlockDirection) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex(
          (block) => block.id === blockId
        )
        const sourceIndex =
          direction === 'previous' ? blockIndex - 1 : blockIndex
        const targetIndex =
          direction === 'previous' ? blockIndex : blockIndex + 1
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

  const moveImage = useCallback(
    (blockId: string, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return

      setBlocks((currentBlocks) => {
        const currentBlockIndex = currentBlocks.findIndex(
          (candidate) => candidate.id === blockId
        )
        const currentBlock = currentBlocks[currentBlockIndex]

        if (!currentBlock || currentBlock.type !== 'image') return currentBlocks
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= currentBlock.images.length ||
          toIndex >= currentBlock.images.length
        ) {
          return currentBlocks
        }

        const nextImages = [...currentBlock.images]
        const [movedImage] = nextImages.splice(fromIndex, 1)

        if (!movedImage) return currentBlocks

        nextImages.splice(toIndex, 0, movedImage)

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
      setIsJournalSaving(false)
      handleMutationError({
        message: 'Could not save changes. Try again.',
        toastMessage: 'Could not save journal',
      })
    },
  })

  const save = () =>
    runMutation(() => {
      setIsJournalSaving(true)
      saveMutation.mutate()
    })

  return {
    appendImagesToBlock,
    blocks,
    convertListBlockToTextBlock,
    errorMessage,
    focusBlock,
    focusListItem,
    focusTextBlock,
    getNextBlock,
    getPreviousBlock,
    headerActions: editorConfig.headerActions,
    insertBlockBelow,
    insertImagesBelow,
    isDirty,
    isEditMode: editorConfig.isEditMode ?? false,
    isSaving: saveMutation.isPending,
    mergeListItem,
    mergeTextBlock,
    moveImage,
    moveBlock,
    save,
    removeBlock,
    removeImage,
    setTitle,
    splitListItem,
    splitTextBlock,
    title,
    updateImageCaption,
    updateListItem,
    updateListStyle,
    updateTextBlock,
    viewHref: editorConfig.viewHref,
  }
}

export default useJournalEditor
