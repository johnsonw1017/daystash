'use client'

import { useEffect } from 'react'
import { useAtom } from 'jotai'
import {
  blocksAtom,
  pendingFocusIndexAtom,
  textAreaRefsAtom,
} from '@/components/journal-editor/atoms'
const useJournalBlocks = () => {
  const [blocks] = useAtom(blocksAtom)
  const [pendingFocusIndex, setPendingFocusIndex] = useAtom(pendingFocusIndexAtom)
  const [textAreaRefs] = useAtom(textAreaRefsAtom)

  useEffect(() => {
    if (pendingFocusIndex === null) return

    const target = textAreaRefs[pendingFocusIndex]
    if (!target) return

    target.focus()
    const length = target.value.length
    target.setSelectionRange(length, length)
    setPendingFocusIndex(null)
  }, [blocks, pendingFocusIndex, setPendingFocusIndex, textAreaRefs])

  return {
    blocks,
  }
}

export default useJournalBlocks
