'use client'

import { atom, createStore } from 'jotai'
import type { Store } from 'jotai/vanilla/store'
import type { JournalBlock } from '@/lib/journals'
import {
  makeTextBlock,
  normalizeEditorBlocks,
} from '@/components/journal-editor/utils'

type UploadDialogState = {
  activeInsertIndex: number | null
  isOpen: boolean
  pendingFiles: File[]
}

export const blocksAtom = atom<JournalBlock[]>([])
export const pendingFocusIndexAtom = atom<number | null>(null)
export const textAreaRefsAtom = atom<Array<HTMLTextAreaElement | null>>([])
export const uploadDialogStateAtom = atom<UploadDialogState>({
  activeInsertIndex: null,
  isOpen: false,
  pendingFiles: [],
})

type CreateJournalBlocksStoreParams = {
  initialBlocks?: JournalBlock[]
}

export const createJournalBlocksStore = ({
  initialBlocks,
}: CreateJournalBlocksStoreParams): Store => {
  const store = createStore()

  store.set(
    blocksAtom,
    initialBlocks?.length ? normalizeEditorBlocks(initialBlocks) : [makeTextBlock()]
  )
  store.set(pendingFocusIndexAtom, null)
  store.set(textAreaRefsAtom, [])
  store.set(uploadDialogStateAtom, {
    activeInsertIndex: null,
    isOpen: false,
    pendingFiles: [],
  })

  return store
}
