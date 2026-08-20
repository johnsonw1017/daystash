'use client'

import { useQuery } from '@tanstack/react-query'
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import type { JournalDetail, JournalListItem } from '@/lib/journals'
import { parseJournalBlocks, type JournalPlace } from '@/lib/journals'
import supabase from '@/lib/supabase/client'

export const journalQueryKeys = {
  all: ['journals'] as const,
  month: (userId: string | undefined, month: string) =>
    [...journalQueryKeys.all, 'month', userId ?? '', month] as const,
  timelineMonths: (userId?: string) =>
    [...journalQueryKeys.all, 'timeline-months', userId ?? ''] as const,
  bySlug: (slug: string) => [...journalQueryKeys.all, 'slug', slug] as const,
}

const getCurrentUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error?.name === 'AuthSessionMissingError') {
    return null
  }

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
  date: string
  thumbnail: JournalThumbnailRow | JournalThumbnailRow[] | null
  places: Array<{ count: number }>
}

type JournalPlaceRow = {
  name: string
  formatted_address: string | null
  google_place_id: string
  google_maps_uri: string
  latitude: number
  longitude: number
}

type JournalDetailRow = {
  id: string
  title: string | null
  slug: string | null
  created_at: string
  date: string
  updated_at: string
  blocks: unknown
  thumbnail_asset_id: string | null
  places: JournalPlaceRow[]
}

export type JournalTimelineMonth = {
  month: string
  journalCount: number
}

const mapJournalListRow = (journal: JournalListRow): JournalListItem => {
  const thumbnail = Array.isArray(journal.thumbnail)
    ? (journal.thumbnail[0] ?? null)
    : journal.thumbnail

  return {
    id: journal.id,
    title: journal.title,
    slug: journal.slug,
    date: journal.date,
    thumbnail: thumbnail
      ? {
          publicId: thumbnail.cloudinary_public_id,
          width: thumbnail.width,
          height: thumbnail.height,
        }
      : null,
    placeCount: journal.places[0]?.count ?? 0,
  }
}

const mapJournalDetailRow = (journal: JournalDetailRow): JournalDetail => {
  const blocks = parseJournalBlocks(journal.blocks)

  return {
    id: journal.id,
    title: journal.title,
    slug: journal.slug,
    created_at: journal.created_at,
    date: journal.date,
    updated_at: journal.updated_at,
    blocks,
    places: journal.places.map(
      (place): JournalPlace => ({
        name: place.name,
        formattedAddress: place.formatted_address,
        googlePlaceId: place.google_place_id,
        googleMapsUri: place.google_maps_uri,
        latitude: place.latitude,
        longitude: place.longitude,
      })
    ),
    thumbnailAssetId: journal.thumbnail_asset_id,
  }
}

const fetchJournalMonth = async (userId: string, month: string) => {
  const start = format(startOfMonth(parseISO(month)), 'yyyy-MM-dd')
  const end = format(endOfMonth(parseISO(month)), 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('journals')
    .select(
      `
        id,
        title,
        slug,
        date,
        thumbnail:journal_assets!journals_thumbnail_asset_id_fkey(
          cloudinary_public_id,
          width,
          height
        ),
        places(count)
      `
    )
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((journal) =>
    mapJournalListRow(journal as JournalListRow)
  )
}

const fetchJournalTimelineMonths = async (): Promise<
  JournalTimelineMonth[]
> => {
  const { data, error } = await supabase.rpc('get_journal_timeline_months')

  if (error) throw new Error(error.message)

  return (data ?? []).map(
    (month: { month: string; journal_count: number | string }) => ({
      month: month.month as string,
      journalCount: Number(month.journal_count),
    })
  )
}

const fetchJournalBySlug = async (
  slug: string
): Promise<JournalDetail | null> => {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const { data: journal, error } = await supabase
    .from('journals')
    .select(
      `
      id, title, slug, created_at, date, updated_at, blocks, thumbnail_asset_id,
      places(name, formatted_address, google_place_id, google_maps_uri, latitude, longitude)
    `
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

  return mapJournalDetailRow(journal as JournalDetailRow)
}

export const useJournalMonth = (userId: string | undefined, month: string) =>
  useQuery({
    queryKey: journalQueryKeys.month(userId, month),
    queryFn: () => fetchJournalMonth(userId!, month),
    enabled: Boolean(userId && month),
    refetchOnMount: true,
  })

export const useJournalTimelineMonths = (userId?: string) =>
  useQuery({
    queryKey: journalQueryKeys.timelineMonths(userId),
    queryFn: fetchJournalTimelineMonths,
    enabled: Boolean(userId),
    refetchOnMount: true,
  })

export const useJournalBySlug = (slug?: string) =>
  useQuery({
    queryKey: journalQueryKeys.bySlug(slug ?? ''),
    queryFn: async () => fetchJournalBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })
