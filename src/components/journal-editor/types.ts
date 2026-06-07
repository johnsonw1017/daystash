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

export type TextJournalBlock = Extract<JournalBlock, { type: 'text' }>
export type ImageJournalBlock = Extract<JournalBlock, { type: 'image' }>
