'use client'

import { atom, createStore } from 'jotai'
import type { Store } from 'jotai/vanilla/store'
import type {
  JournalEditorConfig,
  ImageDialogState,
} from '@/components/journal-editor/types'
import type { JournalBlock } from '@/lib/journals'
import {
  makeTextBlock,
  normalizeEditorBlocks,
} from '@/components/journal-editor/utils'

export const blocksAtom = atom<JournalBlock[]>([])
export const errorMessageAtom = atom('')
export const journalIdAtom = atom<string | undefined>(undefined)
export const publishedBlocksAtom = atom<JournalBlock[]>([])
export const journalEditorConfigAtom = atom<JournalEditorConfig>({
  headerActions: undefined,
  initialHasUnsavedDraft: false,
  isEditMode: false,
  successMessage: 'Journal saved',
  viewHref: undefined,
})
export const lastSavedDraftBlocksAtom = atom<JournalBlock[]>([])
export const hasPersistedDraftAtom = atom(false)
export const pendingTextSelectionAtom = atom<{
  blockId: string
  start: number
  end: number
} | null>(null)
export const textAreaRefsAtom = atom<Record<string, HTMLTextAreaElement | null>>({})
export const titleAtom = atom('')
export const lastSavedTitleAtom = atom('')
export const editorSessionIdAtom = atom('')

const initialImageDialogState: ImageDialogState = {
  isOpen: false,
  insertBelowBlockId: '',
  mobileTargetBlockId: null,
  mobileSession: null,
  mode: 'device',
  pendingFiles: [],
}

export const imageDialogStateAtom = atom<ImageDialogState>(initialImageDialogState)

type CreateJournalBlocksStoreParams = {
  initialBlocks?: JournalBlock[]
  initialPublishedBlocks?: JournalBlock[]
  initialJournalId?: string
  initialTitle?: string
  headerActions?: JournalEditorConfig['headerActions']
  initialHasUnsavedDraft?: boolean
  isEditMode?: boolean
  successMessage?: string
  viewHref?: string
}

export const createJournalBlocksStore = ({
  headerActions,
  initialHasUnsavedDraft = false,
  initialBlocks,
  initialPublishedBlocks,
  initialJournalId,
  initialTitle = '',
  isEditMode = false,
  successMessage = 'Journal saved',
  viewHref,
}: CreateJournalBlocksStoreParams): Store => {
  const store = createStore()
  const nextPublishedBlocks =
    initialPublishedBlocks?.length
      ? normalizeEditorBlocks(initialPublishedBlocks)
      : [makeTextBlock()]
  const nextBlocks =
    initialBlocks?.length ? normalizeEditorBlocks(initialBlocks) : [makeTextBlock()]

  store.set(blocksAtom, nextBlocks)
  store.set(errorMessageAtom, '')
  store.set(hasPersistedDraftAtom, initialHasUnsavedDraft)
  store.set(journalEditorConfigAtom, {
    headerActions,
    initialHasUnsavedDraft,
    isEditMode,
    successMessage,
    viewHref,
  })
  store.set(journalIdAtom, initialJournalId)
  store.set(lastSavedDraftBlocksAtom, nextBlocks)
  store.set(lastSavedTitleAtom, initialTitle)
  store.set(pendingTextSelectionAtom, null)
  store.set(publishedBlocksAtom, nextPublishedBlocks)
  store.set(textAreaRefsAtom, {})
  store.set(imageDialogStateAtom, initialImageDialogState)
  store.set(editorSessionIdAtom, crypto.randomUUID())
  store.set(titleAtom, initialTitle)

  return store
}
