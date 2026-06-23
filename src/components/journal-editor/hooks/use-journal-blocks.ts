'use client'

import { useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { deleteJournalImage } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  pendingTextSelectionAtom,
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
type MergeTextBlockDirection = 'previous' | 'next'

const useJournalBlocks = () => {
  const [blocks] = useAtom(blocksAtom)
  const setBlocks = useSetAtom(blocksAtom)
  const [pendingTextSelection, setPendingTextSelection] = useAtom(
    pendingTextSelectionAtom
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
          currentBlocks[0].text_content.trim().length === 0
            // Replace the initial empty text placeholder when inserting any non-text block.
            ? []
            : [...currentBlocks]

        nextBlocks.splice(blockIndex + 1, 0, nextBlock)
        return reindexBlocks(nextBlocks)
      })

      if (blockType === 'text') {
        if (nextBlock.id) {
          focusTextBlock(nextBlock.id, 0)
        }
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
          currentBlocks[0].text_content.trim().length === 0
            ? []
            : [...currentBlocks]

        nextBlocks.splice(blockIndex + 1, 0, nextBlock)
        return reindexBlocks(nextBlocks)
      })

      return nextBlock.id ?? null
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
            ...images.map((image, imageIndex) => ({
              ...image,
              position: block.images.length + imageIndex,
              alt_text: image.alt_text ?? null,
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

        const before = block.text_content.slice(0, start)
        const after = block.text_content.slice(end)

        return reindexBlocks([
          ...currentBlocks.slice(0, blockIndex),
          { ...block, text_content: before },
          { ...nextBlock, text_content: after },
          ...currentBlocks.slice(blockIndex + 1),
        ])
      })

      if (nextBlock.id) {
        focusTextBlock(nextBlock.id, 0)
      }
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

        return reindexBlocks([
          ...currentBlocks.slice(0, sourceIndex),
          {
            ...sourceBlock,
            text_content: sourceBlock.text_content + targetBlock.text_content,
          },
          ...currentBlocks.slice(targetIndex + 1),
        ])
      })
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
        return reindexBlocks(nextBlocks)
      })
    },
    [setBlocks]
  )

  return {
    appendImagesToBlock,
    blocks,
    insertBlockBelow,
    insertImagesBelow,
    focusTextBlock,
    mergeTextBlock,
    moveBlock,
    removeBlock,
    removeImage,
    setTextareaRef,
    splitTextBlock,
    updateImageCaption,
    updateTextBlock,
  }
}

export default useJournalBlocks
