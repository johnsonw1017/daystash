'use client'

import { useQuery } from '@tanstack/react-query'
import supabase from '@/lib/supabase/client'

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
  content: string
}

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
    .select('text_content, position')
    .eq('journal_id', journal.id)
    .eq('type', 'text')
    .order('position', { ascending: true })

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const content = (blocks ?? [])
    .map((block) => block.text_content?.trim() ?? '')
    .filter(Boolean)
    .join('\n\n')

  return {
    ...journal,
    content,
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
