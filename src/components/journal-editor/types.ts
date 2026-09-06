import type { ReactNode } from 'react'
import type {
  JournalBlock,
  JournalPlace,
  SaveJournalInput,
  SaveJournalResult,
} from '@/lib/journals'

export type JournalEditorProps = {
  initialJournalId?: string
  initialTitle?: string
  initialDate?: string
  initialCreatedAt?: string
  initialBlocks?: JournalBlock[]
  initialThumbnailAssetId?: string | null
  initialPlaces?: JournalPlace[]
  successMessage?: string
  isEditMode?: boolean
  viewHref?: string
  headerActions?: ReactNode
  isOfflineDraft?: boolean
  onDraftChange?: (input: SaveJournalInput) => Promise<unknown> | void
  onDraftSaveStart?: () => void
  saveHandler?: (input: SaveJournalInput) => Promise<SaveJournalResult>
  textOnly?: boolean
}

export type JournalEditorConfig = Pick<
  JournalEditorProps,
  | 'headerActions'
  | 'initialCreatedAt'
  | 'isEditMode'
  | 'isOfflineDraft'
  | 'saveHandler'
  | 'successMessage'
  | 'textOnly'
  | 'viewHref'
> & {
  successMessage: string
}

export type TextJournalBlock = Extract<JournalBlock, { type: 'text' }>
export type ListJournalBlock = Extract<JournalBlock, { type: 'list' }>
export type ImageJournalBlock = Extract<JournalBlock, { type: 'image' }>

export type BlockFocusPlacement = 'start' | 'end'

export type BlockFocusTarget =
  | {
      element: HTMLInputElement | HTMLTextAreaElement
      kind: 'input' | 'textarea'
    }
  | {
      getElement: (placement: BlockFocusPlacement) => HTMLTextAreaElement | null
      kind: 'list'
    }

export type FocusRequest =
  | {
      blockId: string
      placement: BlockFocusPlacement
    }
  | {
      blockId: string
      start: number
      end: number
    }

export type ResolveBlockProps = {
  block: JournalBlock
  blockId: string
}

export type ImageDialogState = {
  isOpen: boolean
  insertBelowBlockId: string
  targetBlockId: string | null
  mobileSession: {
    expiresAt: string
    token: string
  } | null
  mode: 'device' | 'phone'
  pendingFiles: File[]
}
