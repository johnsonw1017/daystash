import type { ReactNode } from 'react'
import type { JournalBlock } from '@/lib/journals'

export type JournalEditorProps = {
  initialJournalId?: string
  initialTitle?: string
  initialBlocks?: JournalBlock[]
  successMessage?: string
  isEditMode?: boolean
  viewHref?: string
  headerActions?: ReactNode
}

export type JournalEditorConfig = Pick<
  JournalEditorProps,
  'headerActions' | 'isEditMode' | 'successMessage' | 'viewHref'
> & {
  successMessage: string
}

export type TextJournalBlock = Extract<JournalBlock, { type: 'text' }>
export type ImageJournalBlock = Extract<JournalBlock, { type: 'image' }>

export type ResolveBlockProps = {
  block: JournalBlock
  blockId: string
}

export type ImageUploadDialogContext = {
  insertBelowBlockId: string
  pendingFiles: File[]
}

export type JournalEditorDialogState =
  | {
      type: null
      isOpen: false
      context: null
    }
  | {
      type: 'image-upload'
      isOpen: true
      context: ImageUploadDialogContext
    }
