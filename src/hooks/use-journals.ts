'use client'

import { useQuery } from '@tanstack/react-query'
import type { JournalBlock, JournalDetail, JournalListItem } from '@/lib/journals'
import supabase from '@/lib/supabase/client'

export const journalQueryKeys = {
  all: ['journals'] as const,
  list: () => [...journalQueryKeys.all, 'list'] as const,
  bySlug: (slug: string) => [...journalQueryKeys.all, 'slug', slug] as const,
}

const getCurrentUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  return user?.id ?? null
}

const fetchJournals = async (): Promise<JournalListItem[]> => {
  const userId = await getCurrentUserId()

  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('journals')
    .select('id, title, slug, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const journals = data ?? []
  const journalIds = journals.map((journal) => journal.id)

  if (!journalIds.length) {
    return []
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('journal_blocks')
    .select('journal_id, text_content, position')
    .in('journal_id', journalIds)
    .eq('type', 'text')
    .order('position', { ascending: true })

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const firstParagraphByJournalId = new Map<string, string>()
  for (const block of blocks ?? []) {
    if (!firstParagraphByJournalId.has(block.journal_id)) {
      firstParagraphByJournalId.set(block.journal_id, block.text_content ?? '')
    }
  }

  return journals.map((journal) => ({
    ...journal,
    excerpt:
      firstParagraphByJournalId.get(journal.id)?.trim() || 'No journal text yet.',
  }))
}

const fetchJournalBySlug = async (slug: string): Promise<JournalDetail | null> => {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const { data: journal, error: journalError } = await supabase
    .from('journals')
    .select('id, title, slug, created_at, updated_at')
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle()

  if (journalError) {
    throw new Error(journalError.message)
  }

  if (!journal) {
    return null
  }

  const { data: blocks, error: blocksError } = await supabase
    .from('journal_blocks')
    .select(
      'id, type, position, text_content, caption, journal_block_images(id, block_id, cloudinary_public_id, position, alt_text, width, height)'
    )
    .eq('journal_id', journal.id)
    .order('position', { ascending: true })

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const normalizedBlocks: JournalBlock[] = (blocks ?? []).map((block) => {
    if (block.type === 'image') {
      const images = (block.journal_block_images ?? [])
        .sort((a, b) => a.position - b.position)
        .map((image) => ({
          id: image.id,
          block_id: image.block_id,
          cloudinary_public_id: image.cloudinary_public_id,
          position: image.position,
          alt_text: image.alt_text,
          width: image.width,
          height: image.height,
        }))

      return {
        id: block.id,
        type: 'image',
        position: block.position,
        caption: block.caption,
        images,
      }
    }

    return {
      id: block.id,
      type: 'text',
      position: block.position,
      text_content: block.text_content ?? '',
    }
  })

  return {
    ...journal,
    blocks: normalizedBlocks,
  }
}

export const useJournals = () => {
  return useQuery({
    queryKey: journalQueryKeys.list(),
    queryFn: fetchJournals,
  })
}

export const useJournalBySlug = (slug?: string) => {
  return useQuery({
    queryKey: journalQueryKeys.bySlug(slug ?? ''),
    queryFn: async () => fetchJournalBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })
}
