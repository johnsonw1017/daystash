'use client'

import { atom, createStore } from 'jotai'
import type { Store } from 'jotai/vanilla/store'
import type {
  JournalEditorConfig,
  JournalEditorDialogState,
} from '@/components/journal-editor/types'
import type { JournalBlock } from '@/lib/journals'
import {
  makeTextBlock,
  normalizeEditorBlocks,
} from '@/components/journal-editor/utils'

export const blocksAtom = atom<JournalBlock[]>([])
export const errorMessageAtom = atom('')
export const journalIdAtom = atom<string | undefined>(undefined)
export const journalEditorConfigAtom = atom<JournalEditorConfig>({
  headerActions: undefined,
  isEditMode: false,
  successMessage: 'Journal saved',
  viewHref: undefined,
})
export const pendingFocusBlockIdAtom = atom<string | null>(null)
export const textAreaRefsAtom = atom<Record<string, HTMLTextAreaElement | null>>({})
export const titleAtom = atom('')

const initialDialogState: JournalEditorDialogState = {
  type: null,
  isOpen: false,
  context: null,
}

export const editorDialogStateAtom = atom<JournalEditorDialogState>(initialDialogState)

type CreateJournalBlocksStoreParams = {
  initialBlocks?: JournalBlock[]
  initialJournalId?: string
  initialTitle?: string
  headerActions?: JournalEditorConfig['headerActions']
  isEditMode?: boolean
  successMessage?: string
  viewHref?: string
}

export const createJournalBlocksStore = ({
  headerActions,
  initialBlocks,
  initialJournalId,
  initialTitle = '',
  isEditMode = false,
  successMessage = 'Journal saved',
  viewHref,
}: CreateJournalBlocksStoreParams): Store => {
  const store = createStore()

  store.set(
    blocksAtom,
    initialBlocks?.length ? normalizeEditorBlocks(initialBlocks) : [makeTextBlock()]
  )
  store.set(errorMessageAtom, '')
  store.set(journalEditorConfigAtom, {
    headerActions,
    isEditMode,
    successMessage,
    viewHref,
  })
  store.set(journalIdAtom, initialJournalId)
  store.set(pendingFocusBlockIdAtom, null)
  store.set(textAreaRefsAtom, {})
  store.set(editorDialogStateAtom, initialDialogState)
  store.set(titleAtom, initialTitle)

  return store
}
