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
