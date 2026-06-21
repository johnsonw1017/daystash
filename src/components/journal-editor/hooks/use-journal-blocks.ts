'use client'

import { useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { deleteJournalImage } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  pendingFocusBlockIdAtom,
  textAreaRefsAtom,
} from '@/components/journal-editor/atoms'
import {
  makeImageBlock,
  makeTextBlock,
  reindexBlocks,
} from '@/components/journal-editor/utils'
import type { JournalBlock } from '@/lib/journals'

const ensureEditorHasBlock = (blocks: ReturnType<typeof reindexBlocks>) =>
  blocks.length ? blocks : [makeTextBlock()]

type InsertBlockType = JournalBlock['type']
type InsertBlockOptions = {
  images?: Parameters<typeof makeImageBlock>[0]
}

const useJournalBlocks = () => {
  const [blocks] = useAtom(blocksAtom)
  const setBlocks = useSetAtom(blocksAtom)
  const [pendingFocusBlockId, setPendingFocusBlockId] = useAtom(
    pendingFocusBlockIdAtom
  )
  const [textAreaRefs] = useAtom(textAreaRefsAtom)
  const setTextAreaRefs = useSetAtom(textAreaRefsAtom)

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => deleteJournalImage({ imageId }),
    onError: () => {
      toast.error('Could not delete image')
    },
  })

  useEffect(() => {
    if (pendingFocusBlockId === null) return

    const target = textAreaRefs[pendingFocusBlockId]
    if (!target) return

    target.focus()
    const length = target.value.length
    target.setSelectionRange(length, length)
    setPendingFocusBlockId(null)
  }, [blocks, pendingFocusBlockId, setPendingFocusBlockId, textAreaRefs])

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
          currentBlocks[0].text_content.trim().length === 0
            // Replace the initial empty text placeholder when inserting any non-text block.
            ? []
            : [...currentBlocks]

        nextBlocks.splice(blockIndex + 1, 0, nextBlock)
        return reindexBlocks(nextBlocks)
      })

      if (blockType === 'text') {
        setPendingFocusBlockId(nextBlock.id ?? null)
      }
    },
    [setBlocks, setPendingFocusBlockId]
  )

  const updateTextBlock = useCallback(
    (blockId: string, value: string) => {
      setBlocks((currentBlocks) => {
        const blockIndex = currentBlocks.findIndex((block) => block.id === blockId)
        const block = currentBlocks[blockIndex]

        if (!block || block.type !== 'text') return currentBlocks

        const nextBlocks = [...currentBlocks]
        nextBlocks[blockIndex] = { ...block, text_content: value }
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
        ensureEditorHasBlock(
          reindexBlocks(currentBlocks.filter((block) => block.id !== blockId))
        )
      )
    },
    [setBlocks]
  )

  const removeImage = useCallback(
    async (blockId: string, imageIndex: number) => {
      const block = blocks.find((candidate) => candidate.id === blockId)
      if (!block || block.type !== 'image') return

      const imageToRemove = block.images[imageIndex]
      if (!imageToRemove) return

      if (imageToRemove.id) {
        await deleteImageMutation.mutateAsync(imageToRemove.id)
      }

      setBlocks((currentBlocks) => {
        const currentBlockIndex = currentBlocks.findIndex(
          (candidate) => candidate.id === blockId
        )
        const currentBlock = currentBlocks[currentBlockIndex]

        if (!currentBlock || currentBlock.type !== 'image') return currentBlocks

        const nextImages = currentBlock.images
          .filter((_, currentImageIndex) => currentImageIndex !== imageIndex)
          .map((image, currentImageIndex) => ({
            ...image,
            position: currentImageIndex,
          }))

        if (!nextImages.length) {
          return ensureEditorHasBlock(
            reindexBlocks(
              currentBlocks.filter((candidate) => candidate.id !== blockId)
            )
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
    [blocks, deleteImageMutation, setBlocks]
  )

  const moveBlock = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return

      setBlocks((currentBlocks) => {
        const fromIndex = currentBlocks.findIndex((block) => block.id === activeId)
        const toIndex = currentBlocks.findIndex((block) => block.id === overId)

        if (fromIndex === -1 || toIndex === -1) return currentBlocks

        const nextBlocks = [...currentBlocks]
        const [movedBlock] = nextBlocks.splice(fromIndex, 1)

        if (!movedBlock) return currentBlocks

        nextBlocks.splice(toIndex, 0, movedBlock)
        return reindexBlocks(nextBlocks)
      })
    },
    [setBlocks]
  )

  return {
    blocks,
    insertBlockBelow,
    moveBlock,
    removeBlock,
    removeImage,
    setTextareaRef,
    updateImageCaption,
    updateTextBlock,
  }
}

export default useJournalBlocks
