'use client'

import { useMutation } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { deleteJournalImage } from '@/app/(journal)/write/actions'
import {
  blocksAtom,
  pendingFocusIndexAtom,
} from '@/components/journal-editor/atoms'
import { makeTextBlock, reindexBlocks } from '@/components/journal-editor/utils'

const useImageBlock = (blockId: string) => {
  const [blocks, setBlocks] = useAtom(blocksAtom)
  const setPendingFocusIndex = useSetAtom(pendingFocusIndexAtom)

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => deleteJournalImage({ imageId }),
    onError: () => {
      toast.error('Could not delete image')
    },
  })

  const blockIndex = blocks.findIndex((block) => block.id === blockId)

  const addBelow = () => {
    if (blockIndex === -1) return

    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      nextBlocks.splice(blockIndex + 1, 0, makeTextBlock())
      return reindexBlocks(nextBlocks)
    })
    setPendingFocusIndex(blockIndex + 1)
  }

  const updateCaption = (value: string) => {
    if (blockIndex === -1) return

    setBlocks((currentBlocks) => {
      const block = currentBlocks[blockIndex]
      if (!block || block.type !== 'image') return currentBlocks

      const nextBlocks = [...currentBlocks]
      nextBlocks[blockIndex] = { ...block, caption: value }
      return nextBlocks
    })
  }

  const removeImage = async (imageIndex: number) => {
    const block = blocks[blockIndex]
    if (!block || block.type !== 'image') return

    const imageToRemove = block.images[imageIndex]
    if (!imageToRemove) return

    if (imageToRemove.id) {
      await deleteImageMutation.mutateAsync(imageToRemove.id)
    }

    setBlocks((currentBlocks) => {
      const currentBlock = currentBlocks.find(
        (candidate) => candidate.id === blockId
      )

      if (!currentBlock || currentBlock.type !== 'image') return currentBlocks

      const currentBlockIndex = currentBlocks.findIndex(
        (candidate) => candidate.id === blockId
      )
      const nextImages = currentBlock.images
        .filter((_, currentImageIndex) => currentImageIndex !== imageIndex)
        .map((image, currentImageIndex) => ({
          ...image,
          position: currentImageIndex,
        }))

      if (!nextImages.length) {
        return reindexBlocks(
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
  }

  return {
    addBelow,
    removeImage,
    updateCaption,
  }
}

export default useImageBlock
