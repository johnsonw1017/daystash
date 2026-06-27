'use client'

import { useQuery } from '@tanstack/react-query'
import type { JournalDetail, JournalListItem } from '@/lib/journals'
import { getJournalExcerpt, parseJournalBlocks } from '@/lib/journals'
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
    .select('id, title, slug, created_at, updated_at, blocks, has_unsaved_draft')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((journal) => {
    const blocks = parseJournalBlocks(journal.blocks)

    return {
      id: journal.id,
      title: journal.title,
      slug: journal.slug,
      created_at: journal.created_at,
      updated_at: journal.updated_at,
      has_unsaved_draft: journal.has_unsaved_draft ?? false,
      excerpt: getJournalExcerpt(blocks),
    }
  })
}

const fetchJournalBySlug = async (slug: string): Promise<JournalDetail | null> => {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const { data: journal, error } = await supabase
    .from('journals')
    .select(
      'id, title, slug, created_at, updated_at, blocks, draft_blocks, has_unsaved_draft'
    )
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!journal) {
    return null
  }

  const blocks = parseJournalBlocks(journal.blocks)
  const draftBlocks = journal.draft_blocks
    ? parseJournalBlocks(journal.draft_blocks)
    : null

  return {
    id: journal.id,
    title: journal.title,
    slug: journal.slug,
    created_at: journal.created_at,
    updated_at: journal.updated_at,
    has_unsaved_draft: journal.has_unsaved_draft ?? false,
    blocks,
    draft_blocks: draftBlocks,
    activeBlocks:
      journal.has_unsaved_draft && draftBlocks?.length ? draftBlocks : blocks,
  }
}

export const useJournals = () =>
  useQuery({
    queryKey: journalQueryKeys.list(),
    queryFn: fetchJournals,
  })

export const useJournalBySlug = (slug?: string) =>
  useQuery({
    queryKey: journalQueryKeys.bySlug(slug ?? ''),
    queryFn: async () => fetchJournalBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })
