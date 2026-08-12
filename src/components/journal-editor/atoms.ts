'use client'

import { atom, createStore } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Store } from 'jotai/vanilla/store'
import type {
  JournalEditorConfig,
  ImageDialogState,
} from '@/components/journal-editor/types'
import type { JournalBlock, JournalPlace } from '@/lib/journals'
import {
  makeTextBlock,
  normalizeEditorBlocks,
} from '@/components/journal-editor/utils'

export const blocksAtom = atom<JournalBlock[]>([])
export const placesAtom = atom<JournalPlace[]>([])

export type PlaceSearchBias = {
  latitude: number
  longitude: number
  updatedAt: string
}

export const placeSearchBiasAtom = atomWithStorage<PlaceSearchBias | null>(
  'daystash:place-search-bias',
  null
)
export const savedPlacesAtom = atom<JournalPlace[]>([])
export const errorMessageAtom = atom('')
export const journalIdAtom = atom<string | undefined>(undefined)
export const journalDateAtom = atom<string | undefined>(undefined)
export const savedJournalDateAtom = atom<string | undefined>(undefined)
export const savedBlocksAtom = atom<JournalBlock[]>([])
export const thumbnailAssetIdAtom = atom<string | null>(null)
export const savedThumbnailAssetIdAtom = atom<string | null>(null)
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
  initialDate?: string
  initialCreatedAt?: string
  initialThumbnailAssetId?: string | null
  initialPlaces?: JournalPlace[]
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
  initialDate,
  initialCreatedAt,
  initialThumbnailAssetId = null,
  initialPlaces = [],
  isEditMode = false,
  successMessage = 'Journal saved',
  viewHref,
}: CreateJournalBlocksStoreParams): Store => {
  const store = createStore()
  const nextBlocks = initialBlocks?.length
    ? normalizeEditorBlocks(initialBlocks)
    : [makeTextBlock()]

  store.set(blocksAtom, nextBlocks)
  store.set(placesAtom, initialPlaces)
  store.set(savedPlacesAtom, initialPlaces)
  store.set(errorMessageAtom, '')
  store.set(journalEditorConfigAtom, {
    headerActions,
    initialCreatedAt,
    isEditMode,
    successMessage,
    viewHref,
  })
  store.set(journalIdAtom, initialJournalId)
  store.set(journalDateAtom, initialDate)
  store.set(savedJournalDateAtom, initialDate)
  store.set(lastSavedTitleAtom, initialTitle)
  store.set(savedBlocksAtom, nextBlocks)
  store.set(thumbnailAssetIdAtom, initialThumbnailAssetId)
  store.set(savedThumbnailAssetIdAtom, initialThumbnailAssetId)
  store.set(sessionAssetIdsAtom, [])
  store.set(isJournalSavingAtom, false)
  store.set(imageDialogStateAtom, initialImageDialogState)
  store.set(editorSessionIdAtom, crypto.randomUUID())
  store.set(titleAtom, initialTitle)

  return store
}
