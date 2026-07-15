'use client'

import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query'
import type { JournalDetail, JournalListItem } from '@/lib/journals'
import { parseJournalBlocks } from '@/lib/journals'
import supabase from '@/lib/supabase/client'

const JOURNALS_PAGE_SIZE = 12

export const journalQueryKeys = {
  all: ['journals'] as const,
  lists: () => [...journalQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...journalQueryKeys.lists(), userId ?? ''] as const,
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

type JournalThumbnailRow = {
  cloudinary_public_id: string
  width: number
  height: number
}

type JournalListRow = {
  id: string
  title: string | null
  slug: string | null
  created_at: string
  updated_at: string
  thumbnail: JournalThumbnailRow | JournalThumbnailRow[] | null
}

type JournalDetailRow = {
  id: string
  title: string | null
  slug: string | null
  created_at: string
  updated_at: string
  blocks: unknown
}

type JournalCursor = {
  createdAt: string
  id: string
}

type JournalPage = {
  journals: JournalListItem[]
  nextCursor: JournalCursor | null
}

const mapJournalListRow = (journal: JournalListRow): JournalListItem => {
  const thumbnail = Array.isArray(journal.thumbnail)
    ? (journal.thumbnail[0] ?? null)
    : journal.thumbnail

  return {
    id: journal.id,
    title: journal.title,
    slug: journal.slug,
    created_at: journal.created_at,
    updated_at: journal.updated_at,
    thumbnail: thumbnail
      ? {
          publicId: thumbnail.cloudinary_public_id,
          width: thumbnail.width,
          height: thumbnail.height,
        }
      : null,
  }
}

const mapJournalDetailRow = (journal: JournalDetailRow): JournalDetail => {
  const blocks = parseJournalBlocks(journal.blocks)

  return {
    id: journal.id,
    title: journal.title,
    slug: journal.slug,
    created_at: journal.created_at,
    updated_at: journal.updated_at,
    blocks,
  }
}

const fetchJournalsPage = async (
  userId: string,
  cursor: JournalCursor | null
): Promise<JournalPage> => {
  let query = supabase
    .from('journals')
    .select(
      `
        id,
        title,
        slug,
        created_at,
        updated_at,
        thumbnail:journal_assets!journals_thumbnail_asset_id_fkey(
          cloudinary_public_id,
          width,
          height
        )
      `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(JOURNALS_PAGE_SIZE + 1)

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as JournalListRow[]
  const pageRows = rows.slice(0, JOURNALS_PAGE_SIZE)
  const lastJournal = pageRows.at(-1)

  return {
    journals: pageRows.map(mapJournalListRow),
    nextCursor:
      rows.length > JOURNALS_PAGE_SIZE && lastJournal
        ? { createdAt: lastJournal.created_at, id: lastJournal.id }
        : null,
  }
}

const fetchJournalBySlug = async (slug: string): Promise<JournalDetail | null> => {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const { data: journal, error } = await supabase
    .from('journals')
    .select('id, title, slug, created_at, updated_at, blocks')
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!journal) {
    return null
  }

  return mapJournalDetailRow(journal as JournalDetailRow)
}

export const useJournals = (userId?: string) =>
  useInfiniteQuery<
    JournalPage,
    Error,
    InfiniteData<JournalPage>,
    ReturnType<typeof journalQueryKeys.list>,
    JournalCursor | null
  >({
    queryKey: journalQueryKeys.list(userId),
    queryFn: ({ pageParam }) => fetchJournalsPage(userId!, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(userId),
  })

export const useJournalBySlug = (slug?: string) =>
  useQuery({
    queryKey: journalQueryKeys.bySlug(slug ?? ''),
    queryFn: async () => fetchJournalBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })
