export type JournalBlockType = 'text' | 'image'

export type JournalBlockImage = {
  id?: string
  block_id?: string
  cloudinary_public_id: string
  position: number
  alt_text: string | null
  width: number
  height: number
}

export type TextJournalBlock = {
  id?: string
  type: 'text'
  position: number
  text_content: string
}

export type ImageJournalBlock = {
  id?: string
  type: 'image'
  position: number
  caption: string | null
  images: JournalBlockImage[]
}

export type JournalBlock = TextJournalBlock | ImageJournalBlock

export type SaveJournalInput = {
  journalId?: string
  title: string
  blocks: JournalBlock[]
}

export type JournalSummary = {
  id: string
  title: string | null
  slug: string | null
  created_at: string
  updated_at: string
}

export type JournalListItem = JournalSummary & {
  excerpt: string
}

export type JournalDetail = JournalSummary & {
  blocks: JournalBlock[]
}
