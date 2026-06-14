'use client'

import { useCallback } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import {
  blocksAtom,
  pendingFocusIndexAtom,
  textAreaRefsAtom,
} from '@/components/journal-editor/atoms'
import { makeTextBlock, reindexBlocks } from '@/components/journal-editor/utils'

const useTextBlock = (blockId: string) => {
  const [blocks, setBlocks] = useAtom(blocksAtom)
  const setPendingFocusIndex = useSetAtom(pendingFocusIndexAtom)
  const setTextAreaRefs = useSetAtom(textAreaRefsAtom)

  const blockIndex = blocks.findIndex((block) => block.id === blockId)
  const blockCount = blocks.length

  const addBelow = () => {
    if (blockIndex === -1) return

    setBlocks((currentBlocks) => {
      const nextBlocks = [...currentBlocks]
      nextBlocks.splice(blockIndex + 1, 0, makeTextBlock())
      return reindexBlocks(nextBlocks)
    })
    setPendingFocusIndex(blockIndex + 1)
  }

  const updateText = (value: string) => {
    if (blockIndex === -1) return

    setBlocks((currentBlocks) => {
      const block = currentBlocks[blockIndex]
      if (!block || block.type !== 'text') return currentBlocks

      const nextBlocks = [...currentBlocks]
      nextBlocks[blockIndex] = { ...block, text_content: value }
      return nextBlocks
    })
  }

  const remove = () => {
    if (blockIndex === -1) return

    setBlocks((currentBlocks) =>
      reindexBlocks(currentBlocks.filter((block) => block.id !== blockId))
    )
  }

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (blockIndex === -1) return

      setTextAreaRefs((currentRefs) => {
        if (currentRefs[blockIndex] === node) return currentRefs

        const nextRefs = [...currentRefs]
        nextRefs[blockIndex] = node
        return nextRefs
      })
    },
    [blockIndex, setTextAreaRefs]
  )

  return {
    addBelow,
    blockCount,
    remove,
    setTextareaRef,
    updateText,
  }
}

export default useTextBlock
