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
export const savedBlocksAtom = atom<JournalBlock[]>([])
export const starredImageAssetIdAtom = atom<string | null>(null)
export const savedStarredImageAssetIdAtom = atom<string | null>(null)
export const sessionAssetIdsAtom = atom<string[]>([])
export const isJournalSavingAtom = atom(false)
export const journalEditorConfigAtom = atom<JournalEditorConfig>({
  headerActions: undefined,
  isEditMode: false,
  successMessage: 'Journal saved',
  viewHref: undefined,
})
export const titleAtom = atom('')
export const lastSavedTitleAtom = atom('')
export const editorSessionIdAtom = atom('')

const initialImageDialogState: ImageDialogState = {
  isOpen: false,
  insertBelowBlockId: '',
  targetBlockId: null,
  mobileSession: null,
  mode: 'device',
  pendingFiles: [],
}

export const imageDialogStateAtom = atom<ImageDialogState>(
  initialImageDialogState
)

type CreateJournalBlocksStoreParams = {
  initialBlocks?: JournalBlock[]
  initialJournalId?: string
  initialTitle?: string
  initialStarredImageAssetId?: string | null
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
  initialStarredImageAssetId = null,
  isEditMode = false,
  successMessage = 'Journal saved',
  viewHref,
}: CreateJournalBlocksStoreParams): Store => {
  const store = createStore()
  const nextBlocks = initialBlocks?.length
    ? normalizeEditorBlocks(initialBlocks)
    : [makeTextBlock()]

  store.set(blocksAtom, nextBlocks)
  store.set(errorMessageAtom, '')
  store.set(journalEditorConfigAtom, {
    headerActions,
    isEditMode,
    successMessage,
    viewHref,
  })
  store.set(journalIdAtom, initialJournalId)
  store.set(lastSavedTitleAtom, initialTitle)
  store.set(savedBlocksAtom, nextBlocks)
  store.set(starredImageAssetIdAtom, initialStarredImageAssetId)
  store.set(savedStarredImageAssetIdAtom, initialStarredImageAssetId)
  store.set(sessionAssetIdsAtom, [])
  store.set(isJournalSavingAtom, false)
  store.set(imageDialogStateAtom, initialImageDialogState)
  store.set(editorSessionIdAtom, crypto.randomUUID())
  store.set(titleAtom, initialTitle)

  return store
}
