'use client'

import { useSetAtom } from 'jotai'
import { imageDialogStateAtom } from '@/components/journal-editor/atoms'
import useJournalEditor from '@/components/journal-editor/hooks/use-journal-editor'

const useBlockInsertion = (blockId: string) => {
  const setImageDialogState = useSetAtom(imageDialogStateAtom)
  const { insertBlockBelow } = useJournalEditor()

  return {
    insertImage: () =>
      setImageDialogState({
        isOpen: true,
        insertBelowBlockId: blockId,
        targetBlockId: null,
        mobileSession: null,
        mode: 'device',
        pendingFiles: [],
      }),
    insertList: () => insertBlockBelow(blockId, 'list'),
    insertText: () => insertBlockBelow(blockId, 'text'),
  }
}

export default useBlockInsertion
